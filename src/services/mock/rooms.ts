import { rooms, posts } from '@/lib/data';
import { ListingValidationError, validateListingInput } from '@/lib/listing-validation';
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
const baseRoomFixtures = rooms.map((room) => {
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
// Additional public fixtures share existing property/image assets and use stable, unique IDs.
const publicTemplates = baseRoomFixtures.filter((room) => room.postStatus === 'APPROVED' && room.roomStatus === 'AVAILABLE' && !room.detail.rented);
const additionalRoomFixtures = Array.from({ length: 45 }, (_, index) => {
  const template = publicTemplates[index % publicTemplates.length];
  const number = String(501 + index);
  const price = 2200000 + (index % 17) * 200000;
  const area = 20 + (index % 11) * 2;
  return {
    ...template,
    legacyId: 1001 + index,
    postStatus: 'APPROVED' as const,
    roomStatus: 'AVAILABLE' as const,
    detail: {
      ...template.detail,
      roomId: roomUuid(1001 + index),
      postId: postUuid(1001 + index),
      roomNumber: number,
      title: `Phòng ${number} — ${template.detail.district}`,
      rentalPrice: price,
      depositAmount: price,
      area,
      maxTenants: area >= 32 ? 3 : 2,
      description: `Phòng ${number} tại ${template.detail.houseName}, diện tích ${area} m². Không gian thoáng, thuận tiện sinh hoạt. Tiện ích: ${template.detail.amenitiesDescription}.`,
      createdAt: new Date(Date.UTC(2026, 9, 22, 12, 0) - index * 3600000).toISOString(),
      rented: false,
      available: true,
    },
  };
});
export const roomFixtures = [...baseRoomFixtures, ...additionalRoomFixtures];
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
function tenantKey() {
  const session = readMockSession();
  if (!session || session.user.role !== 'TENANT') throw new Error('Vui lòng đăng nhập bằng tài khoản khách thuê.');
  return `roomix_mock_favorites_v1:${session.user.id}`;
}
type Saved = { favoriteId: string; postId: string; createdAt: string };
function read(key: string): Saved[] {
  try { const values = JSON.parse(localStorage.getItem(key) || '[]'); if (!Array.isArray(values)) throw new Error(); return values; }
  catch { throw new Error('Không thể đọc danh sách yêu thích đã lưu.'); }
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
export type ModerationNotice = { id: string; action: 'approve' | 'reject' | 'remove' | 'restore'; reason?: string; createdAt: string; read: boolean };
export type CatalogRoom = (typeof roomFixtures)[number] & { landlordId: string; rejectReason?: string; adminRemoveReason?: string; moderationNotices?: ModerationNotice[]; approvedBy?: string; approvedAt?: string };

/* ------------------------- properties (UC03.1/03.2, mock) ------------------------ */
// The backend has no House/Floor controller yet, so houses/floors live in a
// mock property store seeded from the same fixtures the catalog was built
// from. When the backend adds house/floor endpoints, this store is the seam
// to replace — listing creation and the property workspace both read it.
export interface PropertyFloor {
  houseId: string; floorId: string; houseName: string; floorName: string; floorNumber: number;
  landlordId: string; addressStreet: string; ward: string; district: string; city: string;
}
const PROPERTIES_KEY = 'roomix_mock_properties_v1';
export function readProperties(): PropertyFloor[] {
  if (typeof window === 'undefined') return [...propertyFixtures];
  try {
    const raw = localStorage.getItem(PROPERTIES_KEY);
    if (!raw) return [...propertyFixtures];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('Không thể đọc dữ liệu nhà/tầng.');
    return parsed;
  } catch { return [...propertyFixtures]; }
}
function writeProperties(list: PropertyFloor[]) {
  try { localStorage.setItem(PROPERTIES_KEY, JSON.stringify(list)); }
  catch { throw new Error('Không thể lưu dữ liệu. Bộ nhớ trình duyệt có thể đã đầy.'); }
  window.dispatchEvent(new Event(CATALOG_EVENT));
}
function propertyActor() {
  const user = readMockSession()?.user;
  if (!user || user.role !== 'LANDLORD') throw new Error('Tài khoản không có quyền quản lý nhà/tầng.');
  return user;
}
export function createPropertyHouse(input: { houseName: string; addressStreet: string; district: string; city: string }): PropertyFloor {
  const user = propertyActor();
  const houseName = input.houseName.trim();
  if (!houseName) throw new Error('Vui lòng nhập tên nhà.');
  if (houseName.length > 100) throw new Error('Tên nhà tối đa 100 ký tự.');
  const list = readProperties();
  if (list.some((p) => p.landlordId === user.id && p.houseName.toLowerCase() === houseName.toLowerCase())) throw new Error('Tên nhà đã tồn tại.');
  const floor: PropertyFloor = {
    houseId: crypto.randomUUID(), floorId: crypto.randomUUID(), houseName,
    floorName: 'Tầng 1', floorNumber: 1, landlordId: user.id,
    addressStreet: input.addressStreet.trim(), ward: '', district: input.district.trim(), city: input.city.trim() || 'Hà Nội',
  };
  writeProperties([...list, floor]);
  return floor;
}
export function deletePropertyHouse(houseId: string) {
  const user = propertyActor();
  const list = readProperties();
  const house = list.filter((p) => p.houseId === houseId && p.landlordId === user.id);
  if (!house.length) throw new Error('Không tìm thấy nhà thuộc tài khoản.');
  if (readCatalog().some((r) => r.detail.houseId === houseId)) throw new Error('Không thể xóa nhà còn phòng. Hãy xóa hoặc chuyển các phòng trước.');
  writeProperties(list.filter((p) => p.houseId !== houseId));
}
export function createPropertyFloor(houseId: string, floorName: string, floorNumber: number) {
  const user = propertyActor();
  const list = readProperties();
  const house = list.find((p) => p.houseId === houseId && p.landlordId === user.id);
  if (!house) throw new Error('Không tìm thấy nhà thuộc tài khoản.');
  const name = floorName.trim();
  if (!name) throw new Error('Vui lòng nhập tên tầng.');
  if (!Number.isInteger(floorNumber) || floorNumber < 0 || floorNumber > 100) throw new Error('Số tầng phải là số nguyên từ 0 đến 100.');
  if (list.some((p) => p.houseId === houseId && (p.floorName.toLowerCase() === name.toLowerCase() || p.floorNumber === floorNumber))) throw new Error('Tên tầng hoặc số tầng đã tồn tại trong nhà này.');
  const floor: PropertyFloor = { ...house, floorId: crypto.randomUUID(), floorName: name, floorNumber };
  writeProperties([...list, floor]);
  return floor;
}
export function deletePropertyFloor(floorId: string) {
  const user = propertyActor();
  const list = readProperties();
  const floor = list.find((p) => p.floorId === floorId && p.landlordId === user.id);
  if (!floor) throw new Error('Không tìm thấy tầng thuộc tài khoản.');
  if (readCatalog().some((r) => r.detail.floorId === floorId)) throw new Error('Không thể xóa tầng còn phòng. Hãy xóa các phòng trên tầng trước.');
  writeProperties(list.filter((p) => p.floorId !== floorId));
}
/** UC03.4 (mock): landlord switches a room between AVAILABLE / RESERVED /
 * MAINTENANCE. OCCUPIED is system-derived from an ACTIVE tenancy and cannot
 * be set by hand; a room with an ACTIVE tenancy cannot change status here. */
export function changeRoomStatus(roomId: string, status: 'AVAILABLE' | 'RESERVED' | 'MAINTENANCE') {
  const user = propertyActor();
  const list = readCatalog();
  const item = list.find((r) => r.detail.roomId === roomId && r.landlordId === user.id);
  if (!item) throw new Error('Không tìm thấy phòng thuộc tài khoản.');
  const rental = (() => { try { return JSON.parse(localStorage.getItem('roomix_mock_rental_v1') || '{"tenancies":[]}'); } catch { return { tenancies: [] }; } })();
  if ((rental.tenancies as { roomId: string; status: string }[]).some((t) => t.roomId === roomId && t.status === 'ACTIVE')) throw new Error('Phòng đang có khách thuê, không thể đổi trạng thái tại đây.');
  item.roomStatus = status;
  item.detail.available = status === 'AVAILABLE';
  item.detail.rented = false;
  writeCatalog(list);
}
/** UC03.3/UC04.4 (mock): delete a room + its post. Blocked while a rental
 * request is pending or a tenancy is pending/active, so no live business
 * data is orphaned — the same guard the backend delete will need. */
export function deleteListing(roomId: string) {
  const user = propertyActor();
  const list = readCatalog();
  const item = list.find((r) => r.detail.roomId === roomId && r.landlordId === user.id);
  if (!item) throw new Error('Không tìm thấy phòng thuộc tài khoản.');
  const rental = (() => { try { return JSON.parse(localStorage.getItem('roomix_mock_rental_v1') || '{"requests":[],"tenancies":[]}'); } catch { return { requests: [], tenancies: [] }; } })();
  if ((rental.requests as { roomId: string; status: string }[]).some((r) => r.roomId === roomId && r.status === 'PENDING')) throw new Error('Phòng đang có yêu cầu quan tâm chờ xử lý. Hãy xử lý yêu cầu trước khi xóa.');
  if ((rental.tenancies as { roomId: string; status: string }[]).some((t) => t.roomId === roomId && ['PENDING', 'ACTIVE'].includes(t.status))) throw new Error('Phòng đang có hợp đồng chờ cọc hoặc đang thuê. Không thể xóa.');
  writeCatalog(list.filter((r) => r.detail.roomId !== roomId));
}
/** UC04.9 (mock): admin takes down a live post. There is no REMOVED status
 * in the backend enum, so takedown maps to HIDDEN + a recorded reason and a
 * notice for the landlord — the same shape an admin hide endpoint would need. */
export function adminRemovePost(roomId: string, reason: string) {
  const user = actor('ADMIN');
  if (!reason.trim() || reason.length > 1000) throw new Error('Vui lòng nhập lý do gỡ bài, tối đa 1000 ký tự.');
  const list = readCatalog();
  const item = list.find((r) => r.detail.roomId === roomId);
  if (!item || item.postStatus !== 'APPROVED') throw new Error('Chỉ gỡ được tin đang hiển thị.');
  item.postStatus = 'HIDDEN';
  item.adminRemoveReason = reason.trim();
  item.moderationNotices = [...(item.moderationNotices ?? []), { id: crypto.randomUUID(), action: 'remove' as const, reason: reason.trim(), createdAt: new Date().toISOString(), read: false }];
  void user;
  writeCatalog(list);
}
export function adminRestorePost(roomId: string) {
  actor('ADMIN');
  const list = readCatalog();
  const item = list.find((r) => r.detail.roomId === roomId);
  if (!item || item.postStatus !== 'HIDDEN' || !item.adminRemoveReason) throw new Error('Chỉ khôi phục được tin do Admin gỡ.');
  item.postStatus = 'APPROVED';
  item.adminRemoveReason = undefined;
  item.moderationNotices = [...(item.moderationNotices ?? []), { id: crypto.randomUUID(), action: 'restore' as const, createdAt: new Date().toISOString(), read: false }];
  writeCatalog(list);
}
export function readCatalog(): CatalogRoom[] {
  if (typeof window === 'undefined') return roomFixtures.map((r) => ({ ...r, landlordId: LANDLORD_ID }));
  const raw = localStorage.getItem(CATALOG_KEY);
  if (!raw) return roomFixtures.map((r) => ({ ...r, landlordId: LANDLORD_ID }));
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Không thể đọc dữ liệu phòng.');
  const existing = new Set(parsed.map((room: CatalogRoom) => room.detail.roomId));
  return [...parsed, ...additionalRoomFixtures.filter((room) => !existing.has(room.detail.roomId)).map((room) => ({ ...room, landlordId: LANDLORD_ID }))];
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
  if (action === 'reject' && reason.trim().length > 1000) throw new Error('Lý do từ chối không được vượt quá 1.000 ký tự.');
  item.postStatus = ({ submit: 'PENDING', hide: 'HIDDEN', unhide: 'APPROVED', approve: 'APPROVED', reject: 'REJECTED' } as const)[action];
  item.rejectReason = action === 'reject' ? reason.trim() : undefined;
  if (admin) {
    const now = new Date().toISOString();
    item.moderationNotices = [...(item.moderationNotices ?? []), { id: crypto.randomUUID(), action: action === 'approve' ? 'approve' : 'reject', reason: action === 'reject' ? reason.trim() : undefined, createdAt: now, read: false }];
    item.approvedBy = action === 'approve' ? user.id : undefined;
    item.approvedAt = action === 'approve' ? now : undefined;
  }
  writeCatalog(list);
}
export function moderatePost(postId: string, action: 'approve' | 'reject', reason = '') {
  actor('ADMIN');
  const post = readCatalog().find((item) => item.detail.postId === postId);
  if (!post) throw new Error('Không tìm thấy tin đăng cần kiểm duyệt.');
  changePostStatus(post.detail.roomId, action, reason);
}
export function markModerationNoticeRead(postId: string, noticeId: string) {
  const user = actor('LANDLORD');
  const list = readCatalog();
  const post = list.find((item) => item.detail.postId === postId && item.landlordId === user.id);
  const notice = post?.moderationNotices?.find((item) => item.id === noticeId);
  if (!notice) throw new Error('Không tìm thấy thông báo về tin đăng.');
  if (notice.read) return;
  post!.moderationNotices = post!.moderationNotices!.map((item) => item.id === noticeId ? { ...item, read: true } : item);
  writeCatalog(list);
}
export function markAllModerationNoticesRead() {
  const user = actor('LANDLORD');
  const list = readCatalog();
  let changed = false;
  for (const post of list) {
    if (post.landlordId === user.id && post.moderationNotices?.some((notice) => !notice.read)) {
      post.moderationNotices = post.moderationNotices.map((notice) => ({ ...notice, read: true }));
      changed = true;
    }
  }
  if (changed) writeCatalog(list);
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
  const floor = readProperties().find((p) => p.floorId === input.floorId && p.houseId === input.houseId && p.landlordId === user.id);
  if (!floor) throw new Error('Nhà/tầng không thuộc tài khoản chủ trọ.');
  const errors = validateListingInput(input);
  if (Object.keys(errors).length) throw new ListingValidationError(errors);
  const list = readCatalog(); const current = roomId ? list.find((r) => r.detail.roomId === roomId) : undefined;
  if (roomId && (!current || current.landlordId !== user.id)) throw new Error('Không tìm thấy phòng thuộc tài khoản.');
  if (current && !['DRAFT', 'REJECTED'].includes(current.postStatus)) throw new Error('Chỉ được sửa tin nháp hoặc bị từ chối.');
  if (list.some((r) => r.detail.floorId === input.floorId && r.detail.roomNumber === input.roomNumber.trim() && r.detail.roomId !== roomId)) throw new ListingValidationError({ roomNumber: 'Số phòng đã tồn tại trên tầng này.' });
  const imageUrls = [...(current?.detail.imageUrls ?? []), ...images];
  const detail: RoomDetail = {
    ...input, ...floor, roomNumber: input.roomNumber.trim(), title: input.title.trim(), description: input.description.trim(),
    roomId: current?.detail.roomId ?? crypto.randomUUID(), postId: current?.detail.postId ?? crypto.randomUUID(),
    rentalPrice: input.basePrice, rented: current?.detail.rented ?? false, available: !(current?.detail.rented ?? false),
    imageUrls, primaryImageUrl: imageUrls[0] ?? '', createdAt: current?.detail.createdAt ?? new Date().toISOString(),
  };
  const next: CatalogRoom = { legacyId: current?.legacyId ?? 0, roomStatus: current?.roomStatus ?? 'AVAILABLE', postStatus: 'DRAFT', landlordId: user.id, moderationNotices: current?.moderationNotices, detail };
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
