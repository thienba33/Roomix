/**
 * Tenant-flow local state (mock seam).
 *
 * The backend endpoints exist (see docs/FUNCTION_MAP.md) but the frontend is
 * mock-only, so tenant-owned state that the mock dataset cannot hold —
 * favorites, requests the tenant creates/cancels, last-used search filters and
 * the notification preference — is persisted in localStorage under the
 * `roomix:tenant:` prefix. When the real API is wired, these helpers are the
 * single place to swap for `src/services/api.ts` calls.
 */
import { rooms as allRooms, favoriteRooms, requests as seedRequests, tenantUser } from '@/lib/data';
import type { Room, RentalRequestItem, NotificationItem } from '@/types';

/* ------------------------------------------------------------------ types */

export interface TenantFilters {
  /** Price bounds in millions of VND (FilterModal slider range 1–5). */
  priceLo: number;
  priceHi: number;
  /** Area band label from FilterModal ('' = any). */
  size: string;
  amenities: string[];
  /** Room-type label from FilterModal ('Tất cả' = any). */
  type: string;
}

export const DEFAULT_FILTERS: TenantFilters = {
  priceLo: 1,
  priceHi: 5,
  size: '',
  amenities: [],
  type: 'Tất cả',
};

export type SortKey = 'newest' | 'price-asc' | 'price-desc' | 'area-desc' | 'area-asc';

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price-asc', label: 'Giá tăng dần' },
  { value: 'price-desc', label: 'Giá giảm dần' },
  { value: 'area-desc', label: 'Diện tích lớn nhất' },
  { value: 'area-asc', label: 'Diện tích nhỏ nhất' },
];

/** Local widening of the shared RequestStatus — the backend enum includes
 * CANCELLED (POST /api/rentals/{id}/cancel) but src/types does not yet. */
export type TenantRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export interface TenantRequest extends Omit<RentalRequestItem, 'status'> {
  status: TenantRequestStatus;
}

/* ------------------------------------------------------- filtering (UC02) */

/** Category-row mapping. The mock Room model has no room-type / near-school
 * field, so categories map onto the fields that do exist (size, amenities,
 * area) — the same seam the backend /rooms/search params use. */
export function matchesCategory(room: Room, category: string): boolean {
  switch (category) {
    case 'Tất cả':
      return true;
    case 'Phòng đơn':
      return room.size <= 22;
    case 'Phòng đôi':
      return room.size >= 23 && room.size <= 29;
    case 'Nguyên căn':
      return room.size >= 30;
    case 'Gần trường':
      return room.area === 'Thanh Xuân' || room.area === 'Đống Đa';
    case 'Ban công':
      return room.amenities.includes('Ban công');
    case 'Máy giặt':
      return room.amenities.includes('Máy giặt');
    default:
      return true;
  }
}

function matchesSizeBand(room: Room, size: string): boolean {
  if (!size) return true;
  if (size === 'Dưới 20m²') return room.size < 20;
  if (size === '20–30m²') return room.size >= 20 && room.size <= 30;
  if (size === 'Trên 30m²') return room.size > 30;
  return true;
}

/** Room-type mapping on the mock model: ≥30 m² counts as Chung cư mini,
 * everything else is Phòng trọ; no mock room is a KTX. */
function matchesType(room: Room, type: string): boolean {
  if (!type || type === 'Tất cả') return true;
  if (type === 'Phòng trọ') return room.size < 30;
  if (type === 'Chung cư mini') return room.size >= 30;
  if (type === 'KTX') return false;
  return true;
}

export function matchesFilters(room: Room, f: TenantFilters): boolean {
  if (room.price < f.priceLo * 1_000_000 || room.price > f.priceHi * 1_000_000) return false;
  if (!matchesSizeBand(room, f.size)) return false;
  if (!matchesType(room, f.type)) return false;
  return f.amenities.every((a) => room.amenities.includes(a));
}

export function isDefaultFilters(f: TenantFilters): boolean {
  return (
    f.priceLo === DEFAULT_FILTERS.priceLo &&
    f.priceHi === DEFAULT_FILTERS.priceHi &&
    f.size === DEFAULT_FILTERS.size &&
    f.type === DEFAULT_FILTERS.type &&
    f.amenities.length === 0
  );
}

export interface SearchState {
  query: string;
  category: string;
  filters: TenantFilters;
  sort: SortKey;
}

export function applyRoomFilters(list: Room[], s: SearchState): Room[] {
  const q = s.query.trim().toLowerCase();
  const out = list.filter((r) => {
    if (q && !`${r.name} ${r.area} ${r.house}`.toLowerCase().includes(q)) return false;
    if (!matchesCategory(r, s.category)) return false;
    return matchesFilters(r, s.filters);
  });
  switch (s.sort) {
    case 'price-asc':
      return [...out].sort((a, b) => a.price - b.price);
    case 'price-desc':
      return [...out].sort((a, b) => b.price - a.price);
    case 'area-desc':
      return [...out].sort((a, b) => b.size - a.size);
    case 'area-asc':
      return [...out].sort((a, b) => a.size - b.size);
    default:
      return out;
  }
}

/* ------------------------------------------------------------- persistence */

const KEY_FAVORITES = 'roomix:tenant:favorites';
const KEY_USER_REQUESTS = 'roomix:tenant:requests';
const KEY_CANCELLED_SEEDS = 'roomix:tenant:cancelled-seeds';
const KEY_SEARCH = 'roomix:tenant:search';
const KEY_NOTIFICATIONS = 'roomix:tenant:notifications';
const KEY_NOTIFICATION_LIST = 'roomix:tenant:notification-list';
const KEY_PROFILE = 'roomix:tenant:profile';
const KEY_NOTIF_PREFS = 'roomix:tenant:notification-prefs';
export const KEY_AI_CONTEXT = 'roomix:tenant:ai-context';

export const FAVORITES_EVENT = 'roomix:tenant:favorites-changed';
export const OPEN_AI_EVENT = 'roomix:tenant:open-ai';
export const NOTIFICATIONS_EVENT = 'roomix:tenant:notifications-changed';
export const PROFILE_EVENT = 'roomix:tenant:profile-changed';

function readJSON<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode) — state stays in memory only */
  }
}

/* -------------------------------------------------------------- favorites */

export function getFavoriteIds(): number[] {
  const saved = readJSON<number[]>(KEY_FAVORITES);
  if (Array.isArray(saved)) return saved;
  return favoriteRooms.map((r) => r.id);
}

export function setFavoriteIds(ids: number[]) {
  writeJSON(KEY_FAVORITES, ids);
  window.dispatchEvent(new CustomEvent(FAVORITES_EVENT));
}

/** Returns the new favorite state for the room. */
export function toggleFavoriteId(id: number): boolean {
  const ids = getFavoriteIds();
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
  setFavoriteIds(next);
  return next.includes(id);
}

/* --------------------------------------------------------------- requests */

function getUserRequests(): TenantRequest[] {
  const saved = readJSON<TenantRequest[]>(KEY_USER_REQUESTS);
  return Array.isArray(saved) ? saved : [];
}

function getCancelledSeedIds(): number[] {
  const saved = readJSON<number[]>(KEY_CANCELLED_SEEDS);
  return Array.isArray(saved) ? saved : [];
}

/** Tenant-visible request list: own created requests first, then the seeded
 * ones, with persisted cancellations applied to PENDING seeds. */
export function getMergedRequests(): TenantRequest[] {
  const cancelled = getCancelledSeedIds();
  const seeds: TenantRequest[] = seedRequests.map((r) =>
    r.status === 'PENDING' && cancelled.includes(r.id) ? { ...r, status: 'CANCELLED' } : { ...r },
  );
  return [...getUserRequests(), ...seeds];
}

/** Creates a PENDING rental request (backend: POST /api/rentals). */
export function createRequest(room: Room, note: string): TenantRequest {
  const req: TenantRequest = {
    id: Date.now(),
    room: `Phòng ${room.code}`,
    roomId: room.id,
    tenant: tenantUser.name,
    initials: tenantUser.initials,
    date: new Date().toLocaleDateString('vi-VN'),
    message: note.trim() || 'Em quan tâm phòng này, mong anh/chị phản hồi sớm ạ.',
    status: 'PENDING',
  };
  writeJSON(KEY_USER_REQUESTS, [req, ...getUserRequests()]);
  return req;
}

/** The tenant's own live (PENDING/ACCEPTED) request for a room, if any —
 * used to block duplicates on the detail page. Seeded requests count only
 * when they belong to the signed-in tenant. */
export function getActiveRequestForRoom(roomId: number): TenantRequest | undefined {
  const own = getUserRequests().find(
    (r) => r.roomId === roomId && (r.status === 'PENDING' || r.status === 'ACCEPTED'),
  );
  if (own) return own;
  const cancelled = getCancelledSeedIds();
  const seed = seedRequests.find(
    (r) =>
      r.roomId === roomId &&
      r.tenant === tenantUser.name &&
      r.status === 'PENDING' &&
      !cancelled.includes(r.id),
  );
  return seed ? { ...seed } : undefined;
}

/** Cancels a request (backend: POST /api/rentals/{id}/cancel). */
export function cancelRequest(req: TenantRequest) {
  if (getUserRequests().some((r) => r.id === req.id)) {
    writeJSON(
      KEY_USER_REQUESTS,
      getUserRequests().map((r) => (r.id === req.id ? { ...r, status: 'CANCELLED' as const } : r)),
    );
  } else if (req.status === 'PENDING') {
    writeJSON(KEY_CANCELLED_SEEDS, [...getCancelledSeedIds(), req.id]);
  }
}

/** Undo for cancelRequest — restores the request to PENDING. */
export function restoreRequest(req: TenantRequest) {
  if (getUserRequests().some((r) => r.id === req.id)) {
    writeJSON(
      KEY_USER_REQUESTS,
      getUserRequests().map((r) => (r.id === req.id ? { ...r, status: 'PENDING' as const } : r)),
    );
  } else {
    writeJSON(
      KEY_CANCELLED_SEEDS,
      getCancelledSeedIds().filter((id) => id !== req.id),
    );
  }
}

/* ------------------------------------------------- search state persistence */

export interface PersistedSearch extends SearchState {}

export function getPersistedSearch(): PersistedSearch | null {
  return readJSON<PersistedSearch>(KEY_SEARCH);
}

export function persistSearch(s: PersistedSearch) {
  writeJSON(KEY_SEARCH, s);
}

/* ---------------------------------------------------- notification toggle */

export function getNotificationsEnabled(): boolean {
  const saved = readJSON<boolean>(KEY_NOTIFICATIONS);
  return typeof saved === 'boolean' ? saved : true;
}

export function setNotificationsEnabled(on: boolean) {
  writeJSON(KEY_NOTIFICATIONS, on);
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_EVENT));
}

/* ------------------------------------------------- notification list (UC07.7) */

/** Seed notifications for the tenant — the receiver side of the backend
 * Notification module (GET /api/notifications). The stories mirror the mock
 * dataset: Phòng 302 request accepted, Phòng 405 pending, October invoice. */
export const TENANT_NOTIFICATIONS_SEED: NotificationItem[] = [
  { id: 1, type: 'INTEREST_REQUEST', title: 'Yêu cầu được chấp nhận', body: 'Chủ trọ Nguyễn Văn An đã chấp nhận yêu cầu Phòng 302 — Contact Card đã được mở khóa', time: '30 phút trước', read: false },
  { id: 2, type: 'INVOICE', title: 'Hóa đơn tháng 10 đã phát hành', body: 'Phòng 302: 3.350.000đ, hạn thanh toán 05/11', time: 'Hôm nay', read: false },
  { id: 3, type: 'INTEREST_REQUEST', title: 'Đã gửi yêu cầu quan tâm', body: 'Yêu cầu Phòng 405 đang chờ chủ trọ phản hồi', time: 'Hôm qua', read: true },
  { id: 4, type: 'POST_APPROVAL', title: 'Bài đăng phòng yêu thích được duyệt', body: 'Bài đăng Phòng 405 trong danh sách yêu thích của bạn vừa được Admin duyệt hiển thị', time: 'Hôm qua', read: true },
  { id: 5, type: 'SYSTEM', title: 'Thông báo hệ thống', body: 'Roomix bảo trì định kỳ 23:00–23:30 ngày 25/10, dữ liệu của bạn không bị ảnh hưởng', time: '2 ngày trước', read: true },
  { id: 6, type: 'GENERAL', title: 'Hoàn thiện hồ sơ của bạn', body: 'Hồ sơ đã xác minh giúp chủ trọ tin tưởng và phản hồi nhanh hơn', time: '3 ngày trước', read: true },
];

export function getTenantNotifications(): NotificationItem[] {
  const saved = readJSON<NotificationItem[]>(KEY_NOTIFICATION_LIST);
  if (Array.isArray(saved)) return saved;
  return [...TENANT_NOTIFICATIONS_SEED];
}

export function setTenantNotifications(list: NotificationItem[]) {
  writeJSON(KEY_NOTIFICATION_LIST, list);
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_EVENT));
}

export function getUnreadNotificationCount(): number {
  return getTenantNotifications().filter((n) => !n.read).length;
}

/* ------------------------------------------------------- profile (UC01.4) */

export interface TenantProfile {
  name: string;
  phone: string;
  /** Optional contact address — not part of the seed user record. */
  address: string;
}

export function getTenantProfile(): TenantProfile {
  const saved = readJSON<Partial<TenantProfile>>(KEY_PROFILE);
  return {
    name: saved?.name?.trim() ? saved.name : tenantUser.name,
    phone: saved?.phone?.trim() ? saved.phone : tenantUser.phone,
    address: saved?.address ?? '',
  };
}

export function setTenantProfile(p: TenantProfile) {
  writeJSON(KEY_PROFILE, p);
  window.dispatchEvent(new CustomEvent(PROFILE_EVENT));
}

/** Display initials derived from the (possibly edited) profile name —
 * first letters of the last two name parts, matching the seed ('MA'). */
export function profileInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return tenantUser.initials;
  return parts.slice(-2).map((p) => p[0]).join('').toUpperCase();
}

/* ------------------------------------------- notification preferences */

export interface NotificationPrefs {
  email: boolean;
  inApp: boolean;
  push: boolean;
}

export const DEFAULT_NOTIF_PREFS: NotificationPrefs = { email: true, inApp: true, push: false };

export function getNotificationPrefs(): NotificationPrefs {
  const saved = readJSON<Partial<NotificationPrefs>>(KEY_NOTIF_PREFS);
  return { ...DEFAULT_NOTIF_PREFS, ...(saved ?? {}) };
}

export function setNotificationPrefs(p: NotificationPrefs) {
  writeJSON(KEY_NOTIF_PREFS, p);
}

export { allRooms };
