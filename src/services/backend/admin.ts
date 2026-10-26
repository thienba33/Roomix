import { allPages, emit, post } from './http';
import { readSession, type SessionUser } from './session';
export interface AdminUser extends SessionUser { createdAt: string; }
export const USERS_EVENT = 'roomix:users';
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
export async function updateUser(id: string, action: 'lock' | 'unlock' | 'approve-landlord' | 'reject-landlord', reason?: string) {
  const value = await post<AdminUser>(`/api/admin/users/${id}/${action}`, action === 'reject-landlord' ? { reason } : undefined);
  emit(USERS_EVENT); return value;
}
