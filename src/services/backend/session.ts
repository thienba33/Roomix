export interface SessionUser {
  id: string; username: string; email: string; fullName: string; phoneNumber: string;
  role: 'TENANT' | 'LANDLORD' | 'ADMIN';
  status: 'ACTIVE' | 'LOCKED' | 'PENDING_VERIFICATION';
}
export interface AuthResponse {
  accessToken?: string; tokenType?: string; expiresIn: number; user: SessionUser;
}
const KEY = 'roomix_api_session_v1';
export const AUTH_EVENT = 'roomix:auth';
export function readSession(): AuthResponse | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!value?.accessToken || value.accessToken.startsWith('mock-') || !value.user?.id || !['TENANT', 'LANDLORD', 'ADMIN'].includes(value.user.role) || value.user.status !== 'ACTIVE' || !Number.isFinite(value.expiresAt) || value.expiresAt <= Date.now()) return null;
    return value;
  } catch { return null; }
}
export function saveSession(value: AuthResponse) {
  if (!value.accessToken || value.user.status !== 'ACTIVE') throw new Error('Tài khoản chưa được kích hoạt.');
  localStorage.setItem(KEY, JSON.stringify({ ...value, expiresAt: Date.now() + value.expiresIn * 1000 }));
  window.dispatchEvent(new Event(AUTH_EVENT));
}
export function clearSession() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
}
