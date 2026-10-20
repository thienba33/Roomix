'use client';
import { useEffect, useRef, useState } from 'react';
import {
  moderationQueue,
  usersAdminLandlords,
  usersAdminTenants,
  reports as seedReports,
  notificationsAdmin as seedAdminNotifs,
  auditLog as seedAudit,
} from '@/lib/data';
import type { AuditEntry, NotificationItem, Post, ReportItem, UserAccount } from '@/types';

// Flow-local admin store — persisted to localStorage with `roomix:admin:` prefix.
// Shared across admin screens so a moderation decision on C3/C7 leaves the queue
// everywhere (dashboard C2 counts + AdminTopbar badge read the same store),
// lock/verification on C4, report handling on C5 and broadcasts on C6 stay
// consistent within the browser session.
//
// Backend seam notes (see docs/FUNCTION_MAP.md §2.6 / §2.11):
// - Moderation: POST /api/admin/posts/{id}/approve | /reject (reason) — backed.
// - Users: POST /api/admin/users/{id}/lock|unlock|approve-landlord|reject-landlord — backed.
// - Reports (UC07.6): NO backend module — this store is UI-ahead-of-backend.
// - Notifications: GET/PATCH only, NO POST broadcast endpoint — compose is mock-only.
// - AuditLog: entity exists, NO read endpoint — extra entries here are session-local.
// - Face-auth (UC01.6): service is an empty shell, zero endpoints — login scan is a mock seam.

export const ADMIN_KEYS = {
  moderation: 'roomix:admin:moderation-decisions',
  users: 'roomix:admin:users',
  reports: 'roomix:admin:reports',
  notifications: 'roomix:admin:notifications',
  broadcasts: 'roomix:admin:broadcasts',
  auditExtra: 'roomix:admin:audit-extra',
} as const;

const SYNC_EVENT = 'roomix-admin-sync';

/* ---------------------------------- types --------------------------------- */

export interface ModerationDecision {
  postId: number;
  status: 'APPROVED' | 'REJECTED';
  reason?: string;
  decidedAt: string;
}

export type AdminUserStatus = 'ACTIVE' | 'LOCKED' | 'PENDING_VERIFICATION';

export interface AdminUser extends Omit<UserAccount, 'status'> {
  status: AdminUserStatus;
  verificationReason?: string;
}

export interface Broadcast {
  id: number;
  title: string;
  body: string;
  audience: 'all' | 'landlords' | 'tenants';
  audienceLabel: string;
  time: string;
}

/* ---------------------------------- seeds --------------------------------- */

// Dashboard (FUNCTION_MAP A1/A4) claims "3 chủ trọ chờ xác minh" but the base
// mock users contain none — seed the pending-verification queue so UC07.2 /
// approve-landlord + reject-landlord have a real surface.
export const PENDING_LANDLORDS: AdminUser[] = [
  { id: 21, name: 'Đỗ Văn Bình', email: 'binh.do@roomix.vn', phone: '0908 777 888', role: 'LANDLORD', status: 'PENDING_VERIFICATION', joinedAt: '10/2026', house: 'Roomix Ba Đình', rooms: 15 },
  { id: 22, name: 'Hoàng Thị Lan', email: 'lan.hoang@roomix.vn', phone: '0915 444 333', role: 'LANDLORD', status: 'PENDING_VERIFICATION', joinedAt: '10/2026', house: 'Roomix Thanh Trì', rooms: 20 },
  { id: 23, name: 'Ngô Quốc Huy', email: 'huy.ngo@roomix.vn', phone: '0933 222 111', role: 'LANDLORD', status: 'PENDING_VERIFICATION', joinedAt: '10/2026', house: 'Roomix Long Biên', rooms: 12 },
];

function seedUsers(): AdminUser[] {
  return [
    ...usersAdminLandlords.map((u) => ({ ...u, status: u.status as AdminUserStatus })),
    ...usersAdminTenants.map((u) => ({ ...u, status: u.status as AdminUserStatus })),
    ...PENDING_LANDLORDS.map((u) => ({ ...u })),
  ];
}

function seedDecisions(): Record<number, ModerationDecision> {
  return {};
}

/* ------------------------------ storage core ------------------------------ */

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

function writeRaw(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

/** useState persisted to localStorage (admin flow only), synced across mounted components. */
export function useAdminState<T>(key: string, seed: () => T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(seed);
  const [hydrated, setHydrated] = useState(false);
  const lastSerialized = useRef<string>('');

  useEffect(() => {
    const initial = read<T>(key, seed);
    lastSerialized.current = JSON.stringify(initial);
    setValue(initial);
    setHydrated(true);

    const onSync = (e: Event) => {
      const detail = (e as CustomEvent<{ key?: string }>).detail;
      if (detail && detail.key && detail.key !== key) return;
      const next = read<T>(key, seed);
      const s = JSON.stringify(next);
      if (s !== lastSerialized.current) {
        lastSerialized.current = s;
        setValue(next);
      }
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) onSync(e);
    };
    window.addEventListener(SYNC_EVENT, onSync);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(SYNC_EVENT, onSync);
      window.removeEventListener('storage', onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    const s = JSON.stringify(value);
    if (s === lastSerialized.current) return;
    lastSerialized.current = s;
    writeRaw(key, value);
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { key } }));
  }, [key, value, hydrated]);

  return [value, setValue];
}

/* ------------------------------ domain hooks ------------------------------ */

export const useModerationDecisions = () =>
  useAdminState<Record<number, ModerationDecision>>(ADMIN_KEYS.moderation, seedDecisions);

export const useAdminUsers = () => useAdminState<AdminUser[]>(ADMIN_KEYS.users, seedUsers);

export const useAdminReports = () =>
  useAdminState<ReportItem[]>(ADMIN_KEYS.reports, () => seedReports.map((r) => ({ ...r })));

export const useAdminNotifications = () =>
  useAdminState<NotificationItem[]>(ADMIN_KEYS.notifications, () => seedAdminNotifs.map((n) => ({ ...n })));

export const useBroadcasts = () => useAdminState<Broadcast[]>(ADMIN_KEYS.broadcasts, () => []);

export const useAuditExtra = () => useAdminState<AuditEntry[]>(ADMIN_KEYS.auditExtra, () => []);

/** Full audit log: session actions (newest first) on top of the seeded log. */
export function combinedAuditLog(extra: AuditEntry[]): AuditEntry[] {
  return [...extra, ...seedAudit];
}

export function appendAudit(
  setExtra: React.Dispatch<React.SetStateAction<AuditEntry[]>>,
  action: string,
  target: string,
) {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  setExtra((prev) => [
    { id: 1000 + Date.now() % 100000, actor: 'Admin', action, target, time: `${dd}/${mm}/${now.getFullYear()} ${hh}:${min}` },
    ...prev,
  ]);
}

/* --------------------------------- helpers -------------------------------- */

export function pendingModerationCount(decisions: Record<number, ModerationDecision>): number {
  return moderationQueue.filter((p) => !decisions[p.id]).length;
}

export function pendingModerationCountFromStorage(): number {
  const decisions = read<Record<number, ModerationDecision>>(ADMIN_KEYS.moderation, seedDecisions);
  return pendingModerationCount(decisions);
}

export function pendingReportsCountFromStorage(): number {
  const list = read<ReportItem[]>(ADMIN_KEYS.reports, () => seedReports.map((r) => ({ ...r })));
  return list.filter((r) => r.status === 'PENDING').length;
}

export function pendingVerificationCountFromStorage(): number {
  const list = read<AdminUser[]>(ADMIN_KEYS.users, seedUsers);
  return list.filter((u) => u.status === 'PENDING_VERIFICATION').length;
}

export function pendingQueue(decisions: Record<number, ModerationDecision>): Post[] {
  return moderationQueue.filter((p) => !decisions[p.id]);
}

export function landlordFor(post: { roomId: number }): string {
  const map: Record<number, string> = {
    302: 'Nguyễn Văn An',
    405: 'Trần Thu Hằng',
    510: 'Lê Minh Đức',
    102: 'Nguyễn Văn An',
    303: 'Nguyễn Văn An',
    201: 'Trần Thị Mai',
  };
  return map[post.roomId] ?? 'Chủ trọ Roomix';
}

export function todayVN(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function nowStamp(): string {
  const d = new Date();
  return `${todayVN()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function nextId(list: { id: number }[]): number {
  return list.length ? Math.max(...list.map((x) => x.id)) + 1 : 1;
}
