'use client';
import { useEffect, useState } from 'react';
import {
  posts as seedPosts,
  requests as seedRequests,
  tenancies as seedTenancies,
  invoices as seedInvoices,
  notificationsLandlord as seedNotifs,
  rooms as catalogRooms,
} from '@/lib/data';
import type { Invoice, NotificationItem, Post, RentalRequestItem, RoomStatus } from '@/types';

// Flow-local landlord store — persisted to localStorage with `roomix:landlord:` prefix.
// Shared across landlord screens so e.g. accepting a request (B5) creates a tenancy
// visible in Tenants (B6), and a listing created in B4 appears in B3.

export const LS_KEYS = {
  requests: 'roomix:landlord:requests',
  posts: 'roomix:landlord:posts',
  tenancies: 'roomix:landlord:tenancies',
  invoices: 'roomix:landlord:invoices',
  notifications: 'roomix:landlord:notifications',
  roomStatuses: 'roomix:landlord:room-statuses',
  reminders: 'roomix:landlord:reminders',
  draft: 'roomix:landlord:draft-listing',
  profile: 'roomix:landlord:profile',
} as const;

export interface LPost extends Post {
  rejectReason?: string;
  description?: string;
}

export interface LRequest extends RentalRequestItem {
  rejectReason?: string;
}

export type LTenancyStatus = 'PENDING' | 'ACTIVE' | 'ENDING' | 'ENDED' | 'CANCELLED';

export interface LTenancy {
  id: number;
  name: string;
  initials?: string;
  room: string;
  roomCode: string;
  phone: string;
  email: string;
  startDate: string;
  endDate?: string;
  deposit: number;
  monthlyRent: number;
  status: LTenancyStatus;
  depositConfirmed: boolean;
  elecUnitPrice: number;
  waterUnitPrice: number;
  cycle: string;
  sourceRequestId?: number;
}

export interface LInvoice extends Invoice {
  reminders?: { date: string; note?: string }[];
}

export interface ReminderRecord {
  invoiceId: number;
  date: string;
}

export const HOUSES = [
  { id: 1, name: 'Roomix Lê Văn Lương', floors: [1, 2, 3, 4] },
  { id: 2, name: 'Roomix Cầu Giấy', floors: [1, 2, 3] },
  { id: 3, name: 'Roomix Hà Đông', floors: [1, 2] },
];

export const REJECT_REASONS: Record<number, string> = {
  5: 'Ảnh phòng chưa rõ, thiếu ảnh WC và ban công. Vui lòng chụp lại ảnh thực tế và gửi duyệt lại.',
};

function seedLPosts(): LPost[] {
  return seedPosts.map((p) => ({ ...p, rejectReason: REJECT_REASONS[p.id] }));
}

function seedLTenancies(): LTenancy[] {
  return seedTenancies.map((t) => {
    const code = t.room.replace('Phòng', '').trim();
    const rent = catalogRooms.find((r) => r.code === code)?.price ?? t.deposit;
    return {
      id: t.id,
      name: t.name,
      initials: t.initials,
      room: t.room,
      roomCode: code,
      phone: t.phone,
      email: t.email,
      startDate: t.startDate,
      endDate: t.endDate,
      deposit: t.deposit,
      monthlyRent: rent,
      status: t.status as LTenancyStatus,
      depositConfirmed: t.status !== 'ENDING',
      elecUnitPrice: 3500,
      waterUnitPrice: 12000,
      cycle: 'Hàng tháng · đầu tháng',
    };
  });
}

function seedLInvoices(): LInvoice[] {
  // Normalize: backend has no OVERDUE status — overdue is derived from dueDate.
  return seedInvoices.map((inv) => ({
    ...inv,
    status: inv.status === 'OVERDUE' ? ('PENDING' as const) : inv.status,
    reminders: [],
  }));
}

export function parseVNDate(s: string): Date | null {
  const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

export function isOverdue(inv: Pick<Invoice, 'status' | 'dueDate'>, now = new Date('2026-10-21T00:00:00')): boolean {
  if (inv.status === 'PAID') return false;
  const d = parseVNDate(inv.dueDate);
  return !!d && d.getTime() < now.getTime();
}

function read<T>(key: string, seed: () => T): T {
  if (typeof window === 'undefined') return seed();
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return seed();
    return JSON.parse(raw) as T;
  } catch {
    return seed();
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

/** useState persisted to localStorage (landlord flow only). Hydrates on mount. */
export function useLandlordState<T>(key: string, seed: () => T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(seed);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setValue(read<T>(key, seed));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    if (hydrated) write(key, value);
  }, [key, value, hydrated]);
  return [value, setValue];
}

export const useRequestsState = () =>
  useLandlordState<LRequest[]>(LS_KEYS.requests, () => seedRequests.map((r) => ({ ...r })));
export const usePostsState = () => useLandlordState<LPost[]>(LS_KEYS.posts, seedLPosts);
export const useTenanciesState = () => useLandlordState<LTenancy[]>(LS_KEYS.tenancies, seedLTenancies);
export const useInvoicesState = () => useLandlordState<LInvoice[]>(LS_KEYS.invoices, seedLInvoices);
export const useNotificationsState = () =>
  useLandlordState<NotificationItem[]>(LS_KEYS.notifications, () => seedNotifs.map((n) => ({ ...n })));
export const useRoomStatusesState = () =>
  useLandlordState<Record<string, RoomStatus>>(LS_KEYS.roomStatuses, () => ({}));

export function pendingRequestCountFromStorage(): number {
  const list = read<LRequest[]>(LS_KEYS.requests, () => seedRequests.map((r) => ({ ...r })));
  return list.filter((r) => r.status === 'PENDING').length;
}

export function unreadCountFromStorage(): number {
  const list = read<NotificationItem[]>(LS_KEYS.notifications, () => seedNotifs.map((n) => ({ ...n })));
  return list.filter((n) => !n.read).length;
}

export function nextId(list: { id: number }[]): number {
  return list.length ? Math.max(...list.map((x) => x.id)) + 1 : 1;
}

export function todayVN(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function nowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
