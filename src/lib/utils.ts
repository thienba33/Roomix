import type { RoomStatus, PostStatus, InvoiceStatus } from '@/types';

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
export const cx = cn;

export function formatVND(n: number): string {
  return `${n.toLocaleString('vi-VN')}đ`;
}

export function formatPriceShort(n: number): string {
  const tr = n / 1_000_000;
  const s = tr % 1 === 0 ? String(tr) : tr.toFixed(1).replace('.', ',');
  return `${s} tr`;
}

export function formatRating(r: number): string {
  return r.toFixed(1).replace('.', ',');
}

export const roomStatusLabel: Record<RoomStatus, string> = {
  AVAILABLE: 'Còn trống',
  OCCUPIED: 'Đang thuê',
  RESERVED: 'Đã đặt',
  MAINTENANCE: 'Bảo trì',
};

export const roomStatusTone: Record<RoomStatus, 'green' | 'gray' | 'amber' | 'red'> = {
  AVAILABLE: 'green',
  OCCUPIED: 'gray',
  RESERVED: 'amber',
  MAINTENANCE: 'red',
};

export const postStatusLabel: Record<PostStatus, string> = {
  DRAFT: 'Nháp',
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  HIDDEN: 'Đã ẩn',
};

export const invoiceStatusLabel: Record<InvoiceStatus, string> = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  OVERDUE: 'Quá hạn',
  CONFIRMED: 'Đã xác nhận',
};
