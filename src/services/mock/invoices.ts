import { readMockSession } from './auth';
import { readRental, todayVN, type Tenancy } from './rental';
import { pushTenantNotification } from '@/lib/tenant-store';
import { pushLandlordNotification } from '@/lib/landlord-store';

export const INVOICE_KEY = 'roomix_mock_invoices_v1';
export const INVOICE_EVENT = 'roomix:mock:invoices';

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
export interface MockInvoice {
  id: string; invoiceCode: string; tenancyId: string; meterReadingId: string;
  billingMonth: string; dueDate: string; totalAmount: number; paidAmount: number;
  status: InvoiceStatus; revision: number; disputed: boolean;
  disputeReason?: string; disputeResolution?: string; confirmedAt?: string;
  paymentDate?: string; paymentMethod?: PaymentMethod; createdAt: string; updatedAt: string;
  reading: MeterReading; items: InvoiceItem[];
  reminders: { id: string; reminderDate: string; outstandingAmount: number; content: string }[];
  corrections: { revision: number; reason: string; correctedAt: string }[];
}
interface InvoiceState { invoices: MockInvoice[]; }
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

function actor(role?: 'TENANT' | 'LANDLORD') {
  const user = readMockSession()?.user;
  if (!user || !['TENANT', 'LANDLORD'].includes(user.role) || role && user.role !== role) {
    throw new Error('Tài khoản hiện tại không có quyền thực hiện thao tác.');
  }
  return user;
}
export function readInvoices(): MockInvoice[] {
  if (typeof window === 'undefined') return [];
  try {
    const value: InvoiceState = JSON.parse(localStorage.getItem(INVOICE_KEY) || '{"invoices":[]}');
    if (!value || !Array.isArray(value.invoices) || value.invoices.some((invoice) =>
      !invoice || typeof invoice.id !== 'string' || typeof invoice.tenancyId !== 'string' ||
      !['PENDING', 'CONFIRMED', 'PAID'].includes(invoice.status) ||
      !invoice.reading || !Array.isArray(invoice.items) ||
      !Array.isArray(invoice.reminders) || !Array.isArray(invoice.corrections))) throw new Error();
    return value.invoices;
  } catch { throw new Error('Không thể đọc dữ liệu hóa đơn đã lưu.'); }
}
function save(invoices: MockInvoice[]) {
  try { localStorage.setItem(INVOICE_KEY, JSON.stringify({ invoices })); }
  catch { throw new Error('Không thể lưu hóa đơn. Vui lòng kiểm tra bộ nhớ trình duyệt.'); }
  window.dispatchEvent(new Event(INVOICE_EVENT));
}
function tenancyFor(id: string, role: 'TENANT' | 'LANDLORD') {
  const user = actor(role);
  const tenancy = readRental().tenancies.find((item) => item.id === id && item[role === 'TENANT' ? 'tenantId' : 'landlordId'] === user.id);
  if (!tenancy) throw new Error('Không tìm thấy hợp đồng thuộc tài khoản này.');
  return tenancy;
}
function ownedInvoice(id: string, role: 'TENANT' | 'LANDLORD') {
  const invoice = readInvoices().find((item) => item.id === id);
  if (!invoice) throw new Error('Không tìm thấy hóa đơn.');
  const tenancy = tenancyFor(invoice.tenancyId, role);
  return { invoice, tenancy };
}
export function visibleInvoices(): MockInvoice[] {
  const user = actor();
  const ids = new Set(readRental().tenancies.filter((item) => item.tenantId === user.id || item.landlordId === user.id).map((item) => item.id));
  return readInvoices().filter((invoice) => ids.has(invoice.tenancyId));
}
export function isInvoiceOverdue(invoice: MockInvoice, today = todayVN()) {
  return invoice.dueDate < today && invoice.paidAmount < invoice.totalAmount;
}
export function outstanding(invoice: MockInvoice) { return Math.max(0, invoice.totalAmount - invoice.paidAmount); }
function monthOf(date: string) { return date.slice(0, 7); }
function nextMonth(month: string) {
  const [year, value] = month.split('-').map(Number);
  return `${year + (value === 12 ? 1 : 0)}-${String(value === 12 ? 1 : value + 1).padStart(2, '0')}`;
}
function validDate(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
}
function decimal(value: number, positive = false) {
  return Number.isFinite(value) && value >= (positive ? 0.01 : 0) && /^\d{1,13}(\.\d{1,2})?$/.test(String(value));
}
const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
function reasonCheck(reason: string) {
  if (!reason.trim() || reason.length > 2000) throw new Error('Vui lòng nhập lý do, tối đa 2.000 ký tự.');
}
export function invoiceDraftFor(tenancyId: string) {
  const tenancy = tenancyFor(tenancyId, 'LANDLORD');
  if (tenancy.status !== 'ACTIVE') throw new Error('Chỉ lập hóa đơn cho hợp đồng đang thuê.');
  const previous = readInvoices().filter((item) => item.tenancyId === tenancyId).sort((a, b) => b.billingMonth.localeCompare(a.billingMonth))[0];
  const billingMonth = previous ? nextMonth(previous.billingMonth) : monthOf(tenancy.startDate);
  if (billingMonth > monthOf(todayVN()) || billingMonth > monthOf(tenancy.endDate)) throw new Error('Chưa đến kỳ lập hóa đơn tiếp theo.');
  return {
    billingMonth,
    oldElectricityVal: previous?.reading.newElectricityVal ?? tenancy.initialElectricity,
    oldWaterVal: previous?.reading.newWaterVal ?? tenancy.initialWater,
    tenancy,
  };
}
function makeItems(tenancy: Tenancy, electricityUsage: number, waterUsage: number): InvoiceItem[] {
  return [
    { id: crypto.randomUUID(), itemType: 'ROOM_RENT', itemName: 'Tiền phòng', quantity: 1, unitPrice: tenancy.monthlyRent, totalPrice: round(tenancy.monthlyRent) },
    { id: crypto.randomUUID(), itemType: 'ELECTRICITY', itemName: 'Tiền điện', quantity: electricityUsage, unitPrice: tenancy.electricityUnitPrice, totalPrice: round(electricityUsage * tenancy.electricityUnitPrice) },
    { id: crypto.randomUUID(), itemType: 'WATER', itemName: 'Tiền nước', quantity: waterUsage, unitPrice: tenancy.waterUnitPrice, totalPrice: round(waterUsage * tenancy.waterUnitPrice) },
  ];
}
export function createInvoice(input: InvoiceInput) {
  const user = actor('LANDLORD');
  const draft = invoiceDraftFor(input.tenancyId);
  const { tenancy } = draft;
  if (input.billingMonth !== draft.billingMonth) throw new Error('Kỳ hóa đơn phải liền sau kỳ trước và không ở tương lai.');
  if (readInvoices().some((item) => item.tenancyId === input.tenancyId && item.billingMonth === input.billingMonth)) throw new Error('Hợp đồng đã có hóa đơn cho kỳ này.');
  if (!validDate(input.readingDate) || !validDate(input.dueDate) || monthOf(input.readingDate) !== input.billingMonth || input.readingDate < tenancy.startDate || input.readingDate > tenancy.endDate || input.readingDate > todayVN() || input.dueDate < input.readingDate) throw new Error('Ngày ghi phải thuộc kỳ/hợp đồng và không ở tương lai; hạn thanh toán phải từ ngày ghi trở đi.');
  if (![input.oldElectricityVal, input.newElectricityVal, input.oldWaterVal, input.newWaterVal].every((value) => decimal(value))) throw new Error('Chỉ số phải không âm, tối đa 13 chữ số và 2 số lẻ.');
  if (input.oldElectricityVal !== draft.oldElectricityVal || input.oldWaterVal !== draft.oldWaterVal || input.newElectricityVal < input.oldElectricityVal || input.newWaterVal < input.oldWaterVal) throw new Error('Chỉ số cũ phải khớp kỳ trước; chỉ số mới không được nhỏ hơn chỉ số cũ.');
  const electricityUsage = round(input.newElectricityVal - input.oldElectricityVal);
  const waterUsage = round(input.newWaterVal - input.oldWaterVal);
  const items = makeItems(tenancy, electricityUsage, waterUsage);
  const totalAmount = round(items.reduce((sum, item) => sum + item.totalPrice, 0));
  if (totalAmount > 99999999999999999.99) throw new Error('Tổng hóa đơn vượt giới hạn.');
  const timestamp = new Date().toISOString();
  const reading: MeterReading = { id: crypto.randomUUID(), tenancyId: tenancy.id, roomId: tenancy.roomId, billingMonth: input.billingMonth, oldElectricityVal: input.oldElectricityVal, newElectricityVal: input.newElectricityVal, electricityUsage, oldWaterVal: input.oldWaterVal, newWaterVal: input.newWaterVal, waterUsage, recordedBy: user.id, readingDate: input.readingDate };
  const invoice: MockInvoice = { id: crypto.randomUUID(), invoiceCode: `INV-${crypto.randomUUID()}`, tenancyId: tenancy.id, meterReadingId: reading.id, billingMonth: input.billingMonth, dueDate: input.dueDate, totalAmount, paidAmount: 0, status: 'PENDING', revision: 0, disputed: false, createdAt: timestamp, updatedAt: timestamp, reading, items, reminders: [], corrections: [] };
  save([...readInvoices(), invoice]);
  pushTenantNotification({ type: 'INVOICE', title: 'Hóa đơn mới đã phát hành', body: `Hóa đơn kỳ ${input.billingMonth}: ${totalAmount.toLocaleString('vi-VN')}đ, hạn thanh toán ${input.dueDate.split('-').reverse().join('/')}.` });
  return invoice;
}
function mutate(id: string, role: 'TENANT' | 'LANDLORD', change: (invoice: MockInvoice, tenancy: Tenancy) => void) {
  const { invoice, tenancy } = ownedInvoice(id, role);
  const list = readInvoices();
  const next = structuredClone(invoice);
  change(next, tenancy);
  next.updatedAt = new Date().toISOString();
  save(list.map((item) => item.id === id ? next : item));
  return next;
}
export function confirmInvoice(id: string) {
  const next = mutate(id, 'TENANT', (invoice) => {
    if (invoice.disputed) throw new Error('Hóa đơn đang tranh chấp.');
    if (invoice.status === 'CONFIRMED') return;
    if (invoice.status !== 'PENDING') throw new Error('Chỉ xác nhận hóa đơn đang chờ.');
    invoice.status = 'CONFIRMED'; invoice.confirmedAt = new Date().toISOString();
  });
  pushLandlordNotification({ type: 'INVOICE', title: 'Khách đã xác nhận hóa đơn', body: `Hóa đơn kỳ ${next.billingMonth} đã được khách thuê xác nhận, chờ ghi nhận đã thu.` });
  return next;
}
export function payInvoice(id: string, method: PaymentMethod) {
  const next = mutate(id, 'LANDLORD', (invoice) => {
    if (!['CASH', 'BANK_TRANSFER'].includes(method)) throw new Error('Phương thức thanh toán không hợp lệ.');
    if (invoice.disputed) throw new Error('Hóa đơn đang tranh chấp.');
    if (invoice.status === 'PAID') return;
    if (invoice.status !== 'CONFIRMED') throw new Error('Khách thuê cần xác nhận hóa đơn trước khi ghi nhận đã thu.');
    invoice.status = 'PAID'; invoice.paidAmount = invoice.totalAmount;
    invoice.paymentMethod = method; invoice.paymentDate = new Date().toISOString();
  });
  pushTenantNotification({ type: 'INVOICE', title: 'Đã ghi nhận thanh toán', body: `Hóa đơn kỳ ${next.billingMonth} đã được chủ trọ ghi nhận đã thu ${next.totalAmount.toLocaleString('vi-VN')}đ.` });
  return next;
}
export function disputeInvoice(id: string, reason: string) {
  const next = mutate(id, 'TENANT', (invoice) => {
    reasonCheck(reason);
    if (invoice.status === 'PAID') throw new Error('Hóa đơn đã thanh toán không thể tranh chấp.');
    invoice.disputed = true; invoice.disputeReason = reason.trim(); invoice.disputeResolution = undefined;
    invoice.status = 'PENDING'; invoice.confirmedAt = undefined;
  });
  pushLandlordNotification({ type: 'INVOICE', title: 'Hóa đơn bị khiếu nại', body: `Khách thuê khiếu nại hóa đơn kỳ ${next.billingMonth}. Lý do: ${reason.trim()}` });
  return next;
}
export function resolveInvoiceDispute(id: string, reason: string) {
  const next = mutate(id, 'LANDLORD', (invoice) => {
    reasonCheck(reason);
    if (!invoice.disputed || invoice.status === 'PAID') throw new Error('Hóa đơn không ở trạng thái tranh chấp.');
    invoice.disputed = false; invoice.disputeResolution = reason.trim();
    invoice.status = 'PENDING'; invoice.confirmedAt = undefined;
  });
  pushTenantNotification({ type: 'INVOICE', title: 'Khiếu nại hóa đơn đã được xử lý', body: `Chủ trọ đã xử lý khiếu nại hóa đơn kỳ ${next.billingMonth}. Vui lòng kiểm tra và xác nhận lại.` });
  return next;
}
export function remindInvoice(id: string) {
  const next = mutate(id, 'LANDLORD', (invoice) => {
    const today = todayVN();
    if (!isInvoiceOverdue(invoice, today)) throw new Error('Chỉ nhắc hóa đơn quá hạn còn phải thu.');
    if (invoice.reminders.some((item) => item.reminderDate === today)) return;
    invoice.reminders.push({ id: crypto.randomUUID(), reminderDate: today, outstandingAmount: outstanding(invoice), content: `Hóa đơn ${invoice.invoiceCode} đã quá hạn. Vui lòng kiểm tra và thanh toán.` });
  });
  pushTenantNotification({ type: 'INVOICE', title: 'Nhắc hóa đơn quá hạn', body: `Hóa đơn kỳ ${next.billingMonth} đã quá hạn, còn phải thu ${outstanding(next).toLocaleString('vi-VN')}đ.` });
  return next;
}
export function correctInvoice(id: string, input: CorrectionInput) {
  return mutate(id, 'LANDLORD', (invoice, tenancy) => {
    reasonCheck(input.reason);
    const latest = readInvoices().filter((item) => item.tenancyId === tenancy.id).sort((a, b) => b.billingMonth.localeCompare(a.billingMonth))[0];
    if (tenancy.status !== 'ACTIVE' || invoice.status === 'PAID' || invoice.paidAmount !== 0 || latest?.id !== invoice.id) throw new Error('Chỉ sửa hóa đơn mới nhất, chưa thu tiền của hợp đồng đang thuê.');
    if (invoice.revision !== input.expectedRevision) throw new Error('Hóa đơn đã thay đổi. Vui lòng tải lại.');
    if (!validDate(input.readingDate) || !validDate(input.dueDate) || monthOf(input.readingDate) !== invoice.billingMonth || input.readingDate < tenancy.startDate || input.readingDate > tenancy.endDate || input.readingDate > todayVN() || input.dueDate < input.readingDate) throw new Error('Ngày ghi hoặc hạn thanh toán không hợp lệ.');
    if (![input.roomRent, input.electricityUnitPrice, input.waterUnitPrice, input.newElectricityVal, input.newWaterVal].every((value, index) => decimal(value, index === 0)) || input.newElectricityVal < invoice.reading.oldElectricityVal || input.newWaterVal < invoice.reading.oldWaterVal) throw new Error('Giá hoặc chỉ số không hợp lệ.');
    invoice.reading.newElectricityVal = input.newElectricityVal;
    invoice.reading.newWaterVal = input.newWaterVal;
    invoice.reading.electricityUsage = round(input.newElectricityVal - invoice.reading.oldElectricityVal);
    invoice.reading.waterUsage = round(input.newWaterVal - invoice.reading.oldWaterVal);
    invoice.reading.readingDate = input.readingDate;
    invoice.reading.recordedBy = actor('LANDLORD').id;
    invoice.items = makeItems({ ...tenancy, monthlyRent: input.roomRent, electricityUnitPrice: input.electricityUnitPrice, waterUnitPrice: input.waterUnitPrice }, invoice.reading.electricityUsage, invoice.reading.waterUsage);
    invoice.totalAmount = round(invoice.items.reduce((sum, item) => sum + item.totalPrice, 0));
    if (invoice.totalAmount > 99999999999999999.99) throw new Error('Tổng hóa đơn vượt giới hạn.');
    invoice.dueDate = input.dueDate; invoice.status = 'PENDING'; invoice.confirmedAt = undefined;
    invoice.revision += 1;
    invoice.corrections.push({ revision: invoice.revision, reason: input.reason.trim(), correctedAt: new Date().toISOString() });
    // A correction does not silently resolve an existing dispute.
  });
}
