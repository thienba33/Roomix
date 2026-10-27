import { api, allPages, emit, post } from './http';
import { readSession } from './session';
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
export async function getInvoice(id: string): Promise<InvoiceRecord> {
  const [detail, corrections] = await Promise.all([
    api<Detail>(`/api/invoices/${id}`),
    allPages<{ revision: number; reason: string; createdAt: string }>(`/api/invoices/${id}/corrections`),
  ]);
  return { ...detail.invoice, reading: detail.meterReading, items: detail.items ?? [], reminders: [], corrections: corrections.map((entry) => ({ ...entry, correctedAt: entry.createdAt })) };
}
export async function visibleInvoices(): Promise<InvoiceRecord[]> {
  if (!['TENANT', 'LANDLORD'].includes(readSession()?.user.role ?? '')) return [];
  const [summaries, reminders] = await Promise.all([allPages<{ id: string }>('/api/invoices'), allPages<InvoiceRecord['reminders'][number] & { invoiceId: string }>('/api/invoices/reminders')]);
  return Promise.all(summaries.map(async (entry) => ({ ...await getInvoice(entry.id), reminders: reminders.filter((item) => item.invoiceId === entry.id) })));
}
export const isInvoiceOverdue = (invoice: InvoiceRecord, today = todayVN()) => invoice.dueDate < today && invoice.paidAmount < invoice.totalAmount;
export const outstanding = (invoice: InvoiceRecord) => Math.max(0, invoice.totalAmount - invoice.paidAmount);
// Preview uses loaded API data; the backend validates the actual next billing period.
export function invoiceDraftFor(tenancyId: string, tenancies: Tenancy[], invoices: InvoiceRecord[]) {
  const tenancy = tenancies.find((item) => item.id === tenancyId);
  if (!tenancy || tenancy.status !== 'ACTIVE') throw new Error('Chỉ lập hóa đơn cho hợp đồng đang thuê.');
  const previous = invoices.filter((item) => item.tenancyId === tenancyId).sort((a,b) => b.billingMonth.localeCompare(a.billingMonth))[0];
  const date = previous ? new Date(`${previous.billingMonth}-01T00:00:00Z`) : null;
  if (date) date.setUTCMonth(date.getUTCMonth() + 1);
  const billingMonth = date ? date.toISOString().slice(0, 7) : tenancy.startDate.slice(0, 7);
  if (billingMonth > todayVN().slice(0, 7) || billingMonth > tenancy.endDate.slice(0, 7)) throw new Error('Chưa đến kỳ lập hóa đơn tiếp theo.');
  return { billingMonth, oldElectricityVal: previous?.reading.newElectricityVal ?? tenancy.initialElectricity, oldWaterVal: previous?.reading.newWaterVal ?? tenancy.initialWater, tenancy };
}
async function mutate<T>(path: string, body?: unknown) { const result = await post<T>(path, body); emit(INVOICE_EVENT); return result; }
export async function createInvoice(input: InvoiceInput) { const value = await mutate<{ id: string }>('/api/invoices', input); return getInvoice(value.id); }
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
  invoiceId: string;
  invoiceCode: string;
  transactionStatus: string;
  transactionReference: string;
  amount: number;
  paidAt: string;
}

export const createVnpayPaymentUrl = (invoiceId: string) => mutate<VnpayPaymentResponse>(`/api/invoices/${invoiceId}/vnpay/payment-url`);
export const devConfirmVnpay = (invoiceId: string) => mutate<VnpayReturnResponse>(`/api/invoices/${invoiceId}/vnpay/dev-confirm`);


