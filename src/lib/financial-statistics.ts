import type { RoomDetail } from '@/services/backend/rooms';
import type { InvoiceRecord } from '@/services/backend/invoices';
import type { Tenancy } from '@/services/backend/rental';

export type FinancePeriod = 'month' | 'quarter' | 'year';
export const UNKNOWN_HOUSE = 'unknown';

export interface FinanceHouse {
  id: string;
  name: string;
  billed: number;
  collected: number;
  outstanding: number;
  invoiceCount: number;
}

export interface FinanceSummary {
  billed: number;
  collectedForBills: number;
  outstanding: number;
  revenue: number;
  overdueCount: number;
  invoiceCount: number;
  missingPaymentDateCount: number;
  invalidInvoiceCount: number;
  houses: FinanceHouse[];
  monthlyRevenue: { month: string; amount: number }[];
}

function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

const money = (value: number) => Number(value.toFixed(2));

function paymentMonth(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit' }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  return year && month ? `${year}-${month}` : '';
}

export function monthsForPeriod(anchor: string, period: FinancePeriod): string[] {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(anchor)) return [];
  const [year, month] = anchor.split('-').map(Number);
  const first = period === 'year' ? 1 : period === 'quarter' ? Math.floor((month - 1) / 3) * 3 + 1 : month;
  const length = period === 'year' ? 12 : period === 'quarter' ? 3 : 1;
  return Array.from({ length }, (_, index) => monthKey(year, first + index));
}

export function summarizeFinances({
  invoices, tenancies, rooms, landlordId, months, houseId = '', today,
}: {
  invoices: InvoiceRecord[];
  tenancies: Tenancy[];
  rooms: RoomDetail[];
  landlordId: string;
  months: string[];
  houseId?: string;
  today: string;
}): FinanceSummary {
  const monthSet = new Set(months);
  const ownTenancies = new Map(tenancies.filter((item) => item.landlordId === landlordId).map((item) => [item.id, item]));
  const roomHouses = new Map(rooms.map((item) =>
    [item.roomId, { id: item.houseId, name: item.houseName }]));
  const byHouse = new Map<string, FinanceHouse>();
  const monthlyRevenue = months.map((month) => ({ month, amount: 0 }));
  const monthRows = new Map(monthlyRevenue.map((row) => [row.month, row]));
  let billed = 0;
  let collectedForBills = 0;
  let outstanding = 0;
  let revenue = 0;
  let overdueCount = 0;
  let invoiceCount = 0;
  let missingPaymentDateCount = 0;
  let invalidInvoiceCount = 0;

  for (const invoice of invoices) {
    const tenancy = ownTenancies.get(invoice.tenancyId);
    if (!tenancy) continue;
    const house = roomHouses.get(tenancy.roomId) ?? { id: UNKNOWN_HOUSE, name: 'Chưa xác định nhà' };
    if (houseId && house.id !== houseId) continue;
    if (!Number.isFinite(invoice.totalAmount) || invoice.totalAmount < 0 ||
      !Number.isFinite(invoice.paidAmount) || invoice.paidAmount < 0 ||
      !/^\d{4}-(0[1-9]|1[0-2])$/.test(invoice.billingMonth)) {
      invalidInvoiceCount += 1;
      continue;
    }
    const paid = Math.min(Math.max(invoice.paidAmount, 0), invoice.totalAmount);
    const due = Math.max(invoice.totalAmount - paid, 0);

    if (monthSet.has(invoice.billingMonth)) {
      billed += invoice.totalAmount;
      collectedForBills += paid;
      outstanding += due;
      invoiceCount += 1;
      if (invoice.dueDate < today && due > 0) overdueCount += 1;
      const row = byHouse.get(house.id) ?? { ...house, billed: 0, collected: 0, outstanding: 0, invoiceCount: 0 };
      row.billed += invoice.totalAmount;
      row.collected += paid;
      row.outstanding += due;
      row.invoiceCount += 1;
      byHouse.set(house.id, row);
    }

    if (invoice.status === 'PAID' && paid > 0 && invoice.paymentMethod !== 'SETTLEMENT') {
      const paidMonth = invoice.paymentDate ? paymentMonth(invoice.paymentDate) : '';
      if (!paidMonth) {
        if (monthSet.has(invoice.billingMonth)) missingPaymentDateCount += 1;
        continue;
      }
      const row = monthRows.get(paidMonth);
      if (row) {
        row.amount += paid;
        revenue += paid;
      }
    }
  }

  return {
    billed: money(billed), collectedForBills: money(collectedForBills),
    outstanding: money(outstanding), revenue: money(revenue), overdueCount, invoiceCount,
    missingPaymentDateCount, invalidInvoiceCount,
    houses: [...byHouse.values()].map((house) => ({
      ...house, billed: money(house.billed), collected: money(house.collected), outstanding: money(house.outstanding),
    })).sort((a, b) => b.billed - a.billed || a.name.localeCompare(b.name, 'vi')),
    monthlyRevenue: monthlyRevenue.map((row) => ({ ...row, amount: money(row.amount) })),
  };
}
