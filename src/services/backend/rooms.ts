import { api, allPages, emit, post } from './http';
import { AUTH_EVENT, readSession } from './session';
import type { PostStatus, RoomStatus } from '@/types';
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
export interface PropertyFloor {
  houseId: string; floorId: string; houseName: string; floorName: string; floorNumber: number;
  landlordId: string; addressStreet: string; ward: string; district: string; city: string;
}
export interface ListingInput {
  houseId: string; floorId: string; roomNumber: string; area: number; basePrice: number;
  maxTenants: number; title: string; description: string; depositAmount: number; availableFrom: string;
  hasPrivateBathroom: boolean; hasAirConditioner: boolean; hasWaterHeater: boolean; hasBalcony: boolean;
  amenitiesDescription: string;
}
export { AUTH_EVENT };
export const FAVORITES_EVENT = 'roomix:favorites';
export const CATALOG_EVENT = 'roomix:catalog';
export type ModerationNotice = { id: string; action: 'approve' | 'reject' | 'remove' | 'restore'; reason?: string; createdAt: string; read: boolean };
export interface CatalogRoom {
  legacyId: number; postStatus: PostStatus; roomStatus: RoomStatus; detail: RoomDetail;
  landlordId: string; rejectReason?: string; adminRemoveReason?: string;
  moderationNotices?: ModerationNotice[]; approvedBy?: string; approvedAt?: string;
}
export interface LandlordRoomResponse {
  roomId: string; postId: string; houseId: string; floorId: string;
  roomNumber: string; area: number; basePrice: number;
  roomStatus: RoomStatus; postStatus: PostStatus; rented: boolean; imageUrls: string[];
}
export interface LandlordListingResponse {
  landlordId: string; basePrice: number; postStatus: PostStatus; roomStatus: RoomStatus;
  rejectReason?: string; detail: RoomDetail;
}
function ownedRoom(value: LandlordListingResponse): CatalogRoom {
  const imageUrls = value.detail.imageUrls ?? [];
  return {
    legacyId: 0, postStatus: value.postStatus, roomStatus: value.roomStatus,
    landlordId: value.landlordId, rejectReason: value.rejectReason,
    detail: { ...value.detail, rentalPrice: value.basePrice, imageUrls, primaryImageUrl: imageUrls[0] ?? '' },
  };
}
export async function listLandlordRooms(): Promise<CatalogRoom[]> {
  if (readSession()?.user.role !== 'LANDLORD') return [];
  return (await allPages<LandlordListingResponse>('/api/landlords/rooms')).map(ownedRoom);
}
export async function getLandlordRoom(id: string): Promise<CatalogRoom> {
  return ownedRoom(await api<LandlordListingResponse>(`/api/landlords/rooms/${encodeURIComponent(id)}`));
}
export function validateSearch(query: RoomSearch) {
  if (query.minPrice !== undefined && query.maxPrice !== undefined && query.minPrice > query.maxPrice) throw new Error('Giá tối thiểu phải nhỏ hơn hoặc bằng giá tối đa.');
  if ([query.minPrice, query.maxPrice, query.minArea].some((value) => value !== undefined && (!Number.isFinite(value) || value < 0))) throw new Error('Giá và diện tích không hợp lệ.');
}
export async function searchRooms(query: RoomSearch = {}, signal?: AbortSignal): Promise<PageResponse<RoomSummary>> {
  validateSearch(query);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return api(`/api/rooms/search?${params}`, { signal });
}
export async function getRoomDetail(id: string): Promise<RoomDetail> {
  const detail = await api<RoomDetail>(`/api/rooms/${encodeURIComponent(id)}`);
  return { ...detail, primaryImageUrl: detail.imageUrls?.[0] ?? '', imageUrls: detail.imageUrls ?? [] };
}
export const listFavorites = () => api<FavoriteResponse[]>('/api/favorites');
export async function addFavorite(roomId: string) { const value = await post<FavoriteResponse>(`/api/favorites/${roomId}`); emit(FAVORITES_EVENT); return value; }
export async function removeFavorite(roomId: string) { await api(`/api/favorites/${roomId}`, { method: 'DELETE' }); emit(FAVORITES_EVENT); }
export async function changePostStatus(roomId: string, action: 'submit' | 'hide' | 'unhide') {
  const result = await post(`/api/landlords/rooms/${roomId}/${action}`); emit(CATALOG_EVENT); return result;
}
export async function moderatePost(postId: string, action: 'approve' | 'reject', reason = '') {
  const result = await post(`/api/admin/posts/${postId}/${action}`, action === 'reject' ? { reason } : undefined); emit(CATALOG_EVENT); return result;
}
export async function saveListing(input: ListingInput, images: string[], roomId?: string) {
  const form = new FormData();
  form.append('data', new Blob([JSON.stringify(input)], { type: 'application/json' }));
  for (const [index, image] of images.entries()) {
    const response = await fetch(image);
    const blob = await response.blob();
    form.append('images', blob, `room-${index}.${blob.type.split('/')[1] || 'jpg'}`);
  }
  const result = await api<LandlordRoomResponse>(`/api/landlords/rooms${roomId ? `/${roomId}` : ''}`, { method: roomId ? 'PUT' : 'POST', body: form });
  emit(CATALOG_EVENT); return result;
}
export interface AdminPost {
  id: string; roomId: string; landlordId: string; title: string; description: string;
  rentalPrice: number; depositAmount: number; availableFrom: string; status: PostStatus;
  rejectReason?: string; approvedBy?: string; approvedAt?: string; createdAt: string;
}
export async function loadAdminPosts(): Promise<AdminPost[]> {
  if (readSession()?.user.role !== 'ADMIN') return [];
  return allPages<AdminPost>('/api/admin/posts?status=PENDING');
}
