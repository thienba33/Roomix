import { rooms, posts } from '@/lib/data';
import { readMockSession, AUTH_EVENT } from './auth';

export interface RoomSummary {
  postId: string; roomId: string; title: string; rentalPrice: number; area: number; maxTenants: number;
  addressStreet: string; ward: string; district: string; city: string;
  hasPrivateBathroom: boolean; hasAirConditioner: boolean; hasWaterHeater: boolean; hasBalcony: boolean;
  amenitiesDescription: string; primaryImageUrl: string; rented: boolean; available: boolean; createdAt: string;
}
export interface RoomDetail extends RoomSummary {
  houseId: string; floorId: string; houseName: string; floorName: string; floorNumber: number;
  roomNumber: string; description: string; depositAmount: number; availableFrom: string; imageUrls: string[];
}
export interface RoomSearch {
  location?: string; minPrice?: number; maxPrice?: number; minArea?: number;
  amenities?: string[]; sort?: 'newest' | 'price_asc' | 'price_desc'; page?: number; size?: number;
}
export interface PageResponse<T> { content: T[]; page: number; size: number; totalElements: number; totalPages: number; first: boolean; last: boolean; }
export interface FavoriteResponse { favoriteId: string; createdAt: string; room: RoomSummary; }
export const FAVORITES_EVENT = 'roomix:mock:favorites';
export { AUTH_EVENT };
export const roomUuid = (id: number) => `20000000-0000-4000-8000-${String(id).padStart(12, '0')}`;
const postUuid = (id: number) => `30000000-0000-4000-8000-${String(id).padStart(12, '0')}`;
const houses = [...new Set(rooms.map((room) => room.house))];
export const roomFixtures = rooms.map((room) => {
  const post = posts.find((p) => p.roomId === room.id);
  const detail: RoomDetail = {
    roomId: roomUuid(room.id), postId: postUuid(post?.id ?? room.id), title: post?.title ?? room.name,
    rentalPrice: post?.price ?? room.price, area: room.size, maxTenants: 2,
    addressStreet: room.house.replace('Roomix ', ''), ward: '', district: room.area, city: 'Hà Nội',
    hasPrivateBathroom: room.amenities.includes('WC riêng'), hasAirConditioner: room.amenities.includes('Điều hòa'),
    hasWaterHeater: room.amenities.includes('Nóng lạnh'), hasBalcony: room.amenities.includes('Ban công'),
    amenitiesDescription: room.amenities.join(', '), primaryImageUrl: room.image,
    rented: room.status === 'OCCUPIED', available: room.status !== 'OCCUPIED',
    createdAt: post ? `${post.createdAt.split('/').reverse().join('-')}T00:00:00Z` : '2026-10-01T00:00:00Z',
    houseId: `40000000-0000-4000-8000-${String(houses.indexOf(room.house) + 1).padStart(12, '0')}`,
    floorId: `50000000-0000-4000-8000-${String((houses.indexOf(room.house) + 1) * 100 + room.floor).padStart(12, '0')}`,
    houseName: room.house, floorName: `Tầng ${room.floor}`, floorNumber: room.floor, roomNumber: room.code,
    description: `${room.name}, diện tích ${room.size} m². Tiện ích: ${room.amenities.join(', ')}.`,
    depositAmount: room.price, availableFrom: '2026-11-01', imageUrls: room.gallery ?? [room.image],
  };
  return { legacyId: room.id, postStatus: post?.status ?? 'DRAFT', roomStatus: room.status, detail };
});
function summary(detail: RoomDetail): RoomSummary {
  const { postId, roomId, title, rentalPrice, area, maxTenants, addressStreet, ward, district, city, hasPrivateBathroom, hasAirConditioner, hasWaterHeater, hasBalcony, amenitiesDescription, primaryImageUrl, rented, available, createdAt } = detail;
  return { postId, roomId, title, rentalPrice, area, maxTenants, addressStreet, ward, district, city, hasPrivateBathroom, hasAirConditioner, hasWaterHeater, hasBalcony, amenitiesDescription, primaryImageUrl, rented, available, createdAt };
}
export function searchRooms(query: RoomSearch = {}): PageResponse<RoomSummary> {
  const { minPrice, maxPrice, minArea, location = '', amenities = [], sort = 'newest', page = 0, size = 20 } = query;
  if (!Number.isInteger(page) || page < 0 || !Number.isInteger(size) || size < 1 || size > 100) throw new Error('Phân trang không hợp lệ.');
  if ([minPrice, maxPrice].some((v) => v !== undefined && (!Number.isFinite(v) || v < 0)) || (minArea !== undefined && (!Number.isFinite(minArea) || minArea <= 0))) throw new Error('Giá và diện tích không hợp lệ.');
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) throw new Error('Giá tối thiểu phải nhỏ hơn hoặc bằng giá tối đa.');
  if (!['newest', 'price_asc', 'price_desc'].includes(sort)) throw new Error('Cách sắp xếp không hợp lệ.');
  const result = catalogWithRental().filter((r) => r.postStatus === 'APPROVED' && r.roomStatus === 'AVAILABLE' && !r.detail.rented).map((r) => summary(r.detail)).filter((r) => {
    if (minPrice !== undefined && r.rentalPrice < minPrice || maxPrice !== undefined && r.rentalPrice > maxPrice || minArea !== undefined && r.area < minArea) return false;
    if (![r.addressStreet, r.ward, r.district, r.city].some((s) => s.toLowerCase().includes(location.trim().toLowerCase()))) return false;
    return amenities.every((raw) => {
      const key = raw.trim().toLowerCase();
      if (['private_bathroom', 'bathroom', 'khep_kin'].includes(key)) return r.hasPrivateBathroom;
      if (['air_conditioner', 'air-conditioner', 'dieu_hoa'].includes(key)) return r.hasAirConditioner;
      if (['water_heater', 'hot_water', 'nong_lanh'].includes(key)) return r.hasWaterHeater;
      if (['balcony', 'ban_cong'].includes(key)) return r.hasBalcony;
      return r.amenitiesDescription.toLowerCase().includes(key);
    });
  }).sort((a, b) => sort === 'price_asc' ? a.rentalPrice - b.rentalPrice : sort === 'price_desc' ? b.rentalPrice - a.rentalPrice : b.createdAt.localeCompare(a.createdAt));
  const totalPages = Math.ceil(result.length / size);
  return { content: result.slice(page * size, (page + 1) * size), page, size, totalElements: result.length, totalPages, first: page === 0, last: page + 1 >= totalPages };
}
export function getRoomDetail(id: string): RoomDetail | null {
  return catalogWithRental().find((r) => r.detail.roomId === id && r.postStatus === 'APPROVED')?.detail ?? null;
}
export const GUEST_FAVORITES_KEY = 'roomix_guest_favorites_v1';
function tenantKey() {
  const session = readMockSession();
  if (!session) return GUEST_FAVORITES_KEY;
  if (session.user.role !== 'TENANT') throw new Error('Vui lòng đăng nhập bằng tài khoản khách thuê.');
  return `roomix_mock_favorites_v1:${session.user.id}`;
}
type Saved = { favoriteId: string; postId: string; createdAt: string };
function read(key: string): Saved[] {
  try { const values = JSON.parse(localStorage.getItem(key) || '[]'); if (!Array.isArray(values)) throw new Error(); return values; }
  catch { throw new Error('Không thể đọc danh sách yêu thích đã lưu.'); }
}
// Merge only into the currently authenticated tenant. Write before clearing the guest list.
export function mergeGuestFavorites() {
  const session = readMockSession();
  if (session?.user.role !== 'TENANT') return;
  const guest = read(GUEST_FAVORITES_KEY);
  if (!guest.length) return;
  const key = tenantKey();
  const existing = read(key);
  const ids = new Set(existing.map((entry) => entry.postId));
  const approved = new Set(readCatalog().filter((r) => r.postStatus === 'APPROVED').map((r) => r.detail.postId));
  const merged = [...existing];
  for (const entry of guest) {
    if (approved.has(entry.postId) && !ids.has(entry.postId)) {
      merged.push(entry);
      ids.add(entry.postId);
    }
  }
  localStorage.setItem(key, JSON.stringify(merged));
  localStorage.removeItem(GUEST_FAVORITES_KEY);
  window.dispatchEvent(new Event(FAVORITES_EVENT));
}
export function listFavorites(): FavoriteResponse[] {
  return read(tenantKey()).flatMap((saved) => {
    const fixture = catalogWithRental().find((r) => r.detail.postId === saved.postId && r.postStatus === 'APPROVED');
    return fixture ? [{ favoriteId: saved.favoriteId, createdAt: saved.createdAt, room: summary(fixture.detail) }] : [];
  });
}
export function addFavorite(roomId: string): FavoriteResponse {
  const key = tenantKey(); const detail = getRoomDetail(roomId);
  if (!detail) throw new Error('Tin đăng không còn khả dụng.');
  const saved = read(key);
  if (saved.some((s) => s.postId === detail.postId)) throw new Error('Phòng đã có trong danh sách yêu thích.');
  const entry = { favoriteId: crypto.randomUUID(), postId: detail.postId, createdAt: new Date().toISOString() };
  localStorage.setItem(key, JSON.stringify([...saved, entry]));
  window.dispatchEvent(new Event(FAVORITES_EVENT));
  return { favoriteId: entry.favoriteId, createdAt: entry.createdAt, room: summary(detail) };
}
export function removeFavorite(roomId: string) {
  const key = tenantKey(); const saved = read(key);
  const ids = readCatalog().filter((r) => r.detail.roomId === roomId).map((r) => r.detail.postId);
  const remaining = saved.filter((s) => !ids.includes(s.postId));
  if (remaining.length === saved.length) throw new Error('Phòng không có trong danh sách yêu thích.');
  localStorage.setItem(key, JSON.stringify(remaining));
  window.dispatchEvent(new Event(FAVORITES_EVENT));
}

export const CATALOG_EVENT = 'roomix:mock:catalog';
const CATALOG_KEY = 'roomix_mock_catalog_v1';
const LANDLORD_ID = '10000000-0000-4000-8000-000000000002';
export type CatalogRoom = (typeof roomFixtures)[number] & { landlordId: string; rejectReason?: string };
export function readCatalog(): CatalogRoom[] {
  if (typeof window === 'undefined') return roomFixtures.map((r) => ({ ...r, landlordId: LANDLORD_ID }));
  const raw = localStorage.getItem(CATALOG_KEY);
  if (!raw) return roomFixtures.map((r) => ({ ...r, landlordId: LANDLORD_ID }));
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Không thể đọc dữ liệu phòng.');
  return parsed;
}
function writeCatalog(list: CatalogRoom[]) {
  try { localStorage.setItem(CATALOG_KEY, JSON.stringify(list)); }
  catch { throw new Error('Không thể lưu dữ liệu. Bộ nhớ trình duyệt có thể đã đầy.'); }
  window.dispatchEvent(new Event(CATALOG_EVENT));
}
function actor(role: 'LANDLORD' | 'ADMIN') {
  const user = readMockSession()?.user;
  if (!user || user.role !== role) throw new Error('Tài khoản không có quyền thực hiện thao tác này.');
  return user;
}
export function changePostStatus(roomId: string, action: 'submit' | 'hide' | 'unhide' | 'approve' | 'reject', reason = '') {
  const admin = action === 'approve' || action === 'reject';
  const user = actor(admin ? 'ADMIN' : 'LANDLORD');
  const list = readCatalog(); const item = list.find((r) => r.detail.roomId === roomId);
  if (!item || (!admin && item.landlordId !== user.id)) throw new Error('Không tìm thấy phòng thuộc tài khoản.');
  const allowed = { submit: ['DRAFT', 'REJECTED'], hide: ['APPROVED'], unhide: ['HIDDEN'], approve: ['PENDING'], reject: ['PENDING'] };
  if (!allowed[action].includes(item.postStatus)) throw new Error('Trạng thái tin đã thay đổi. Vui lòng tải lại danh sách.');
  if (action === 'submit' && (item.detail.area <= 0 || item.detail.rentalPrice <= 0 || !item.detail.imageUrls.length)) throw new Error('Cần diện tích, giá thuê lớn hơn 0 và ít nhất một ảnh để gửi duyệt.');
  if (action === 'reject' && !reason.trim()) throw new Error('Vui lòng nhập lý do từ chối.');
  item.postStatus = ({ submit: 'PENDING', hide: 'HIDDEN', unhide: 'APPROVED', approve: 'APPROVED', reject: 'REJECTED' } as const)[action];
  item.rejectReason = action === 'reject' ? reason.trim() : undefined;
  writeCatalog(list);
}
export const propertyFixtures = [...new Map(roomFixtures.map((r) => [r.detail.floorId, {
  houseId: r.detail.houseId, floorId: r.detail.floorId, houseName: r.detail.houseName,
  floorName: r.detail.floorName, floorNumber: r.detail.floorNumber, landlordId: LANDLORD_ID,
  addressStreet: r.detail.addressStreet, ward: r.detail.ward, district: r.detail.district, city: r.detail.city,
}])).values()];
export interface ListingInput {
  houseId: string; floorId: string; roomNumber: string; area: number; basePrice: number;
  maxTenants: number; title: string; description: string; depositAmount: number; availableFrom: string;
  hasPrivateBathroom: boolean; hasAirConditioner: boolean; hasWaterHeater: boolean; hasBalcony: boolean;
  amenitiesDescription: string;
}
export function saveListing(input: ListingInput, images: string[], roomId?: string) {
  const user = actor('LANDLORD');
  const floor = propertyFixtures.find((p) => p.floorId === input.floorId && p.houseId === input.houseId && p.landlordId === user.id);
  if (!floor) throw new Error('Nhà/tầng không thuộc tài khoản chủ trọ.');
  if (!input.roomNumber.trim() || input.roomNumber.length > 50 || !input.title.trim() || input.title.length > 200 || !input.description.trim()) throw new Error('Vui lòng kiểm tra số phòng, tiêu đề và mô tả.');
  if (![input.area, input.basePrice, input.depositAmount, input.maxTenants].every(Number.isFinite) || input.area < 0.01 || input.basePrice < 0 || input.depositAmount < 0 || !Number.isInteger(input.maxTenants) || input.maxTenants < 1) throw new Error('Diện tích, giá, tiền cọc hoặc sức chứa không hợp lệ.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.availableFrom) || Number.isNaN(Date.parse(input.availableFrom)) || new Date(input.availableFrom).toISOString().slice(0, 10) !== input.availableFrom || input.amenitiesDescription.length > 3000) throw new Error('Ngày có thể thuê hoặc mô tả tiện ích không hợp lệ.');
  const list = readCatalog(); const current = roomId ? list.find((r) => r.detail.roomId === roomId) : undefined;
  if (roomId && (!current || current.landlordId !== user.id)) throw new Error('Không tìm thấy phòng thuộc tài khoản.');
  if (current && !['DRAFT', 'REJECTED'].includes(current.postStatus)) throw new Error('Chỉ được sửa tin nháp hoặc bị từ chối.');
  if (list.some((r) => r.detail.floorId === input.floorId && r.detail.roomNumber === input.roomNumber.trim() && r.detail.roomId !== roomId)) throw new Error('Số phòng đã tồn tại trên tầng này.');
  const imageUrls = [...(current?.detail.imageUrls ?? []), ...images];
  const detail: RoomDetail = {
    ...input, ...floor, roomNumber: input.roomNumber.trim(), title: input.title.trim(), description: input.description.trim(),
    roomId: current?.detail.roomId ?? crypto.randomUUID(), postId: current?.detail.postId ?? crypto.randomUUID(),
    rentalPrice: input.basePrice, rented: current?.detail.rented ?? false, available: !(current?.detail.rented ?? false),
    imageUrls, primaryImageUrl: imageUrls[0] ?? '', createdAt: current?.detail.createdAt ?? new Date().toISOString(),
  };
  const next: CatalogRoom = { legacyId: current?.legacyId ?? 0, roomStatus: current?.roomStatus ?? 'AVAILABLE', postStatus: 'DRAFT', landlordId: user.id, detail };
  writeCatalog(current ? list.map((r) => r.detail.roomId === roomId ? next : r) : [...list, next]);
  return next;
}

// Project the mock equivalent of TENANCY_ACTIVATED without persisting a second copy.
export function catalogWithRental(): CatalogRoom[] {
  const catalog = readCatalog();
  if (typeof window === 'undefined') return catalog;
  const rental = JSON.parse(localStorage.getItem('roomix_mock_rental_v1') || '{"tenancies":[]}');
  const occupied = new Set((rental.tenancies as { roomId: string; status: string }[]).filter((t) => t.status === 'ACTIVE').map((t) => t.roomId));
  return catalog.map((r) => occupied.has(r.detail.roomId) ? { ...r, roomStatus: 'OCCUPIED', detail: { ...r.detail, rented: true, available: false } } : r);
}
