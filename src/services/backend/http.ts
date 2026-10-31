import { clearSession, readSession, readStoredSession, saveSession, type AuthResponse } from './session';

// Requests use Next's same-origin rewrite, avoiding browser CORS restrictions.
export const API_URL = '/backend';
export class ApiError extends Error {
  constructor(message: string, public status: number, public errors?: Record<string, string>) { super(message); }
}
let refreshInFlight: Promise<AuthResponse | null> | null = null;

function isAuthEndpoint(path: string) {
  return path.startsWith('/api/auth/');
}

function isPublicGet(path: string, init: RequestInit) {
  const method = (init.method ?? 'GET').toUpperCase();
  return method === 'GET' && (
    path.startsWith('/api/rooms/')
    || path.startsWith('/api/users/landlords/')
    || path.startsWith('/api/invoices/vnpay/return')
    || path.startsWith('/api/invoices/vnpay/ipn')
  );
}

async function refreshAccessToken(): Promise<AuthResponse | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST', credentials: 'include', cache: 'no-store',
          signal: AbortSignal.timeout(30000),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.data?.accessToken) {
          if (response.status === 401) clearSession();
          return null;
        }
        const session = payload.data as AuthResponse;
        saveSession(session);
        return session;
      } catch {
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

async function ensureSession(): Promise<AuthResponse | null> {
  const stored = readStoredSession();
  if (!stored) return null;
  const expiresAt = stored.expiresAt;
  if (expiresAt === undefined || !Number.isFinite(expiresAt) || expiresAt - Date.now() > 60_000) return stored;
  return refreshAccessToken();
}

async function request<T>(path: string, init: RequestInit, canRefresh: boolean): Promise<T> {
  const publicGet = isPublicGet(path, init);
  const session = publicGet ? null : isAuthEndpoint(path) ? readSession() : await ensureSession();
  const headers = new Headers(init.headers);
  if (session?.accessToken) headers.set('Authorization', `Bearer ${session.accessToken}`);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init, headers, credentials: 'include', cache: 'no-store',
      signal: init.signal ?? AbortSignal.timeout(30000),
    });
  }
  catch (cause) {
    if (cause instanceof Error && cause.name === 'AbortError') throw cause;
    throw new ApiError('Không kết nối được backend. Kiểm tra dịch vụ và thử lại.', 0);
  }
  if (response.status === 401 && canRefresh && !publicGet && !isAuthEndpoint(path) && session) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return request<T>(path, init, false);
    clearSession();
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && !publicGet && session && readSession()?.accessToken === session.accessToken) clearSession();
    const detail = payload?.message || payload?.detail;
    const fields = payload?.errors ? Object.values(payload.errors).join(' ') : '';
    throw new ApiError([typeof detail === 'string' ? detail : response.status === 403 ? 'Bạn không có quyền thực hiện thao tác này.' : 'Yêu cầu thất bại.', fields].filter(Boolean).join(' '), response.status, payload?.errors);
  }
  return (payload && Object.hasOwn(payload, 'data') ? payload.data : payload) as T;
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  return request<T>(path, init, true);
}
export const post = <T>(path: string, body?: unknown) => api<T>(path, { method: 'POST', ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
export interface ApiPage<T> { content: T[]; totalPages: number; totalElements: number; last: boolean; }
export async function allPages<T>(path: string): Promise<T[]> {
  const output: T[] = [];
  const token = readSession()?.accessToken;
  for (let page = 0; ; page++) {
    const result = await api<ApiPage<T>>(`${path}${path.includes('?') ? '&' : '?'}page=${page}&size=100`);
    if (readSession()?.accessToken !== token) throw new ApiError('Phiên đăng nhập đã thay đổi. Vui lòng tải lại dữ liệu.', 401);
    output.push(...result.content);
    if (result.last || page + 1 >= result.totalPages) return output;
  }
}
export function emit(event: string) { window.dispatchEvent(new Event(event)); }
