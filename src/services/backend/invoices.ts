import { api, allPages, emit, post, type ApiPage } from './http';
import { readSession, sessionVersion } from './session';
import { todayVN, type Tenancy } from './rental';
export type InvoiceStatus = 'PENDING' | 'CONFIRMED' | 'PAID';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER';
export type InvoiceItemType = 'ROOM_RENT' | 'ELECTRICITY' | 'WATER';
export interface MeterReading {
  id: string; tenancyId: string; roomId: string; billingMonth: string;
  oldElectricityVal: number; newElectricityVal: number; electricityUsage: number;
  oldWaterVal: number; newWaterVal: number; waterUsage: number;
  recordedBy: string; readingDate: string;
}
export interface InvoiceItem {
  id: string; itemType: InvoiceItemType; itemName: string;
  quantity: number; unitPrice: number; totalPrice: number;
}
export interface InvoiceRecord {
  id: string; invoiceCode: string; tenancyId: string; meterReadingId: string;
  billingMonth: string; dueDate: string; totalAmount: number; paidAmount: number;
  status: InvoiceStatus; revision: number; disputed: boolean;
  disputeReason?: string; disputeResolution?: string; confirmedAt?: string;
  paymentDate?: string; paymentMethod?: PaymentMethod | 'SETTLEMENT'; createdAt: string; updatedAt: string;
  reading: MeterReading; items: InvoiceItem[];
  reminders: { id: string; reminderDate: string; outstandingAmount: number; content: string }[];
  corrections: { revision: number; reason: string; correctedAt: string }[];
}

export interface InvoiceInput {
  tenancyId: string; billingMonth: string; dueDate: string; readingDate: string;
  oldElectricityVal: number; newElectricityVal: number;
  oldWaterVal: number; newWaterVal: number;
}
export interface CorrectionInput {
  expectedRevision: number; reason: string; readingDate: string; dueDate: string;
  roomRent: number; electricityUnitPrice: number; waterUnitPrice: number;
  newElectricityVal: number; newWaterVal: number;
}

export const INVOICE_EVENT = 'roomix:invoices';
interface Detail { invoice: Omit<InvoiceRecord, 'reading' | 'items' | 'reminders' | 'corrections'>; meterReading: MeterReading; items: InvoiceItem[]; }
export type InvoiceSummary = Pick<InvoiceRecord, 'id' | 'invoiceCode' | 'tenancyId' | 'billingMonth' | 'dueDate' | 'status' | 'totalAmount' | 'paidAmount' | 'disputed'>;
export type FinancialInvoice = InvoiceSummary & Pick<InvoiceRecord, 'paymentDate' | 'paymentMethod'>;
export type InvoiceReminder = InvoiceRecord['reminders'][number] & { invoiceId: string };
export async function getInvoice(id: string): Promise<InvoiceRecord> {
  const detail = await api<Detail>(`/api/invoices/${encodeURIComponent(id)}`);
  return { ...detail.invoice, reading: detail.meterReading, items: detail.items ?? [], reminders: [], corrections: [] };
}
export async function getInvoiceCorrections(id: string) {
  const result = await allPages<{ revision: number; reason: string; createdAt: string }>(`/api/invoices/${encodeURIComponent(id)}/corrections`);
  return result.map((entry) => ({ ...entry, correctedAt: entry.createdAt }));
}
export const listInvoiceReminders = () => allPages<InvoiceReminder>('/api/invoices/reminders');
export async function visibleInvoices(): Promise<InvoiceSummary[]> {
  if (!['TENANT', 'LANDLORD'].includes(readSession()?.user.role ?? '')) return [];
  return allPages<InvoiceSummary>('/api/invoices');
}
// Paid invoices are immutable. Keep only payment metadata needed by statistics,
// scoped to the session, with a bounded lifetime and invalidation after mutations.
let paymentCacheVersion = -1;
const paymentCache = new Map<string, { expires: number; task: Promise<Pick<InvoiceRecord, 'paymentDate' | 'paymentMethod'>> }>();
async function paymentMetadata(invoice: InvoiceSummary) {
  const version = sessionVersion();
  if (paymentCacheVersion !== version) { paymentCache.clear(); paymentCacheVersion = version; }
  const key = `${invoice.id}:${invoice.totalAmount}:${invoice.paidAmount}`;
  const cached = paymentCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.task;
  const task = getInvoice(invoice.id).then(({ paymentDate, paymentMethod }) => ({ paymentDate, paymentMethod })).catch((error) => { paymentCache.delete(key); throw error; });
  if (paymentCache.size >= 500) paymentCache.delete(paymentCache.keys().next().value!);
  paymentCache.set(key, { expires: Date.now() + 300000, task });
  return task;
}
export async function financialInvoices(): Promise<FinancialInvoice[]> {
  const summaries = await visibleInvoices();
  const result: FinancialInvoice[] = [...summaries];
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(4, summaries.length) }, async () => {
    while (next < summaries.length) {
      const index = next++;
      if (summaries[index].status === 'PAID') result[index] = { ...summaries[index], ...await paymentMetadata(summaries[index]) };
    }
  }));
  return result;
}
export async function loadInvoiceDraft(tenancyId: string, tenancies: Tenancy[]) {
  const params = new URLSearchParams({ tenancyId, page: '0', size: '1' });
  const latest = await api<ApiPage<InvoiceSummary>>(`/api/invoices?${params}`);
  const previous = latest.content[0] ? [await getInvoice(latest.content[0].id)] : [];
  return invoiceDraftFor(tenancyId, tenancies, previous);
}
export const isInvoiceOverdue = (invoice: Pick<InvoiceSummary, 'dueDate' | 'totalAmount' | 'paidAmount'>, today = todayVN()) => invoice.dueDate < today && invoice.paidAmount < invoice.totalAmount;
export const outstanding = (invoice: Pick<InvoiceSummary, 'totalAmount' | 'paidAmount'>) => Math.max(0, invoice.totalAmount - invoice.paidAmount);
// Preview uses loaded API data; the backend validates the actual next billing period.
export function invoiceDraftFor(tenancyId: string, tenancies: Tenancy[], invoices: InvoiceRecord[]) {
  const tenancy = tenancies.find((item) => item.id === tenancyId);
  if (!tenancy || tenancy.status !== 'ACTIVE') throw new Error('Chỉ lập hóa đơn cho hợp đồng đang thuê.');
  const today = todayVN();
  if (tenancy.startDate > today) {
    throw new Error(`Chưa đến ngày bắt đầu hợp đồng. Có thể lập hóa đơn từ ngày ${tenancy.startDate.split('-').reverse().join('/')}.`);
  }
  const previous = invoices.filter((item) => item.tenancyId === tenancyId).sort((a,b) => b.billingMonth.localeCompare(a.billingMonth))[0];
  const date = previous ? new Date(`${previous.billingMonth}-01T00:00:00Z`) : null;
  if (date) date.setUTCMonth(date.getUTCMonth() + 1);
  const billingMonth = date ? date.toISOString().slice(0, 7) : tenancy.startDate.slice(0, 7);
  if (billingMonth > today.slice(0, 7) || billingMonth > tenancy.endDate.slice(0, 7)) throw new Error('Chưa đến kỳ lập hóa đơn tiếp theo.');
  return { billingMonth, oldElectricityVal: previous?.reading.newElectricityVal ?? tenancy.initialElectricity, oldWaterVal: previous?.reading.newWaterVal ?? tenancy.initialWater, tenancy };
}
async function mutate<T>(path: string, body?: unknown) { const result = await post<T>(path, body); paymentCache.clear(); emit(INVOICE_EVENT); return result; }
export async function createInvoice(input: InvoiceInput): Promise<InvoiceRecord> {
  const detail = await mutate<Detail>('/api/invoices', input);
  return { ...detail.invoice, reading: detail.meterReading, items: detail.items ?? [], reminders: [], corrections: [] };
}
export const confirmInvoice = (id: string) => mutate(`/api/invoices/${id}/confirm`);
export const payInvoice = (id: string, paymentMethod: PaymentMethod) => mutate(`/api/invoices/${id}/pay`, { paymentMethod });
export const disputeInvoice = (id: string, reason: string) => mutate(`/api/invoices/${id}/dispute`, { reason });
export const resolveInvoiceDispute = (id: string, reason: string) => mutate(`/api/invoices/${id}/resolve-dispute`, { reason });
export const remindInvoice = (id: string) => mutate(`/api/invoices/${id}/remind`);
export const correctInvoice = (id: string, input: CorrectionInput) => mutate(`/api/invoices/${id}/corrections`, input);

export interface VnpayPaymentResponse {
  invoiceId: string;
  paymentUrl: string;
}
export interface VnpayReturnResponse {
  invoiceId?: string;
  txnRef?: string;
  responseCode?: string;
  paymentStatus: 'SUCCESS' | 'FAILED' | 'PENDING' | 'INVALID' | 'UNKNOWN';
  message: string;
}

export const createVnpayPaymentUrl = (invoiceId: string) => mutate<VnpayPaymentResponse>(`/api/invoices/${invoiceId}/vnpay/payment-url`);
export const devConfirmVnpay = (invoiceId: string) => mutate<VnpayReturnResponse>(`/api/invoices/${invoiceId}/vnpay/dev-confirm`);
export const getVnpayReturnResult = (query: string) =>
  api<VnpayReturnResponse>(`/api/invoices/vnpay/return?${query}`);
