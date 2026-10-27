import { allPages, api, emit, post } from './http';
import { readSession, type SessionUser } from './session';
import type { PostStatus } from '@/types';
export interface AdminUser extends SessionUser { createdAt: string; }
export interface LandlordProperty {
  houseId: string;
  houseName: string;
  address: string;
  totalFloors: number;
  rooms: {
    id: string;
    roomNumber: string;
    area: number;
    basePrice: number;
    maxTenants: number;
    status: string;
  }[];
}
export interface AdminPost {
  id: string;
  roomId: string;
  landlordId: string;
  title: string;
  description: string;
  rentalPrice: number;
  depositAmount: number;
  availableFrom: string;
  status: PostStatus;
  rejectReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}
export const USERS_EVENT = 'roomix:users';
export const POSTS_EVENT = 'roomix:admin-posts';

export async function listUsers() {
  if (readSession()?.user.role !== 'ADMIN') return [];
  // The management API requires one of these two roles and excludes ADMIN.
  // Current backend passes a missing/blank keyword as an untyped SQL null,
  // causing lower(bytea). Its LIKE search supports %, which matches every
  // username and preserves the unfiltered list without modifying the backend.
  const keyword = encodeURIComponent('%');
  const groups = await Promise.all((['TENANT', 'LANDLORD'] as const).map((role) =>
    allPages<AdminUser>(`/api/admin/users?role=${role}&keyword=${keyword}`)));
  return groups.flat();
}

export const getAdminUser = (userId: string) =>
  api<AdminUser>(`/api/admin/users/${userId}`);

export const getAdminUserProperties = (userId: string) =>
  api<LandlordProperty[]>(`/api/admin/users/${userId}/properties`);

export async function updateUser(id: string, action: 'lock' | 'unlock' | 'approve-landlord' | 'reject-landlord', reason?: string) {
  const value = await post<AdminUser>(`/api/admin/users/${id}/${action}`, action === 'reject-landlord' ? { reason } : undefined);
  emit(USERS_EVENT); return value;
}

export async function listPendingPosts(status: PostStatus = 'PENDING'): Promise<AdminPost[]> {
  if (readSession()?.user.role !== 'ADMIN') return [];
  return allPages<AdminPost>(`/api/admin/posts?status=${status}`);
}

export async function approvePost(postId: string) {
  const res = await post<AdminPost>(`/api/admin/posts/${postId}/approve`);
  emit(POSTS_EVENT);
  return res;
}

export async function rejectPost(postId: string, reason: string) {
  const res = await post<AdminPost>(`/api/admin/posts/${postId}/reject`, { reason });
  emit(POSTS_EVENT);
  return res;
}
