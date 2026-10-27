export interface SessionUser {
  id: string; username: string; email: string; fullName: string; phoneNumber: string;
  avatarUrl?: string | null; zalo?: string | null; createdAt?: string; updatedAt?: string;
  role: 'TENANT' | 'LANDLORD' | 'ADMIN';
  status: 'ACTIVE' | 'LOCKED' | 'PENDING_VERIFICATION';
}
export interface AuthResponse {
  accessToken?: string; tokenType?: string; expiresIn: number; expiresAt?: number; user: SessionUser;
}
const KEY = 'roomix_api_session_v1';
export const AUTH_EVENT = 'roomix:auth';
function parseSession(): AuthResponse | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!value?.accessToken || value.accessToken.startsWith('mock-') || !value.user?.id || !['TENANT', 'LANDLORD', 'ADMIN'].includes(value.user.role) || value.user.status !== 'ACTIVE' || !Number.isFinite(value.expiresAt)) return null;
    return value;
  } catch { return null; }
}
export function readStoredSession(): AuthResponse | null { return parseSession(); }
// Expiration is renewed by http.ts through the HttpOnly refresh cookie.
// Keep the stored access token readable so the request layer can refresh it
// instead of treating normal access-token expiry as a logout.
export function readSession(): AuthResponse | null { return parseSession(); }
export function saveSession(value: AuthResponse) {
  if (!value.accessToken || value.user.status !== 'ACTIVE') throw new Error('Tài khoản chưa được kích hoạt.');
  localStorage.setItem(KEY, JSON.stringify({ ...value, expiresAt: Date.now() + value.expiresIn * 1000 }));
  window.dispatchEvent(new Event(AUTH_EVENT));
}
export function updateSessionUser(user: SessionUser) {
  const session = readStoredSession();
  if (!session) return;
  localStorage.setItem(KEY, JSON.stringify({ ...session, user }));
  window.dispatchEvent(new Event(AUTH_EVENT));
}
export function clearSession() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
}
