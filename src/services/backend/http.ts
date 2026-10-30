import { clearSession, readSession, sessionVersion, needsSessionRestore, finishSessionRestore, saveRefreshedSession, withAuthLock, type AuthResponse } from './session';

export const API_URL = '/backend';
export class ApiError extends Error {
  constructor(message: string, public status: number, public errors?: Record<string, string>) { super(message); }
}
let refreshInFlight: { version: number; task: Promise<AuthResponse | null> } | null = null;
const changedSession = () => new ApiError('Phiên đăng nhập đã thay đổi. Vui lòng tải lại dữ liệu.', 401);
const isAuthEndpoint = (path: string) => path.startsWith('/api/auth/') && path !== '/api/auth/change-password';
const changesCookie = (path: string) => ['/api/auth/login', '/api/auth/register', '/api/auth/logout', '/api/auth/face/complete'].includes(path);

async function refreshAccessToken(): Promise<AuthResponse | null> {
  const version = sessionVersion();
  if (refreshInFlight?.version === version) return refreshInFlight.task;
  const task = withAuthLock(async () => {
    if (sessionVersion() !== version) return null;
    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST', credentials: 'include', cache: 'no-store', signal: AbortSignal.timeout(30000),
      });
      const payload = await response.json().catch(() => null);
      if (sessionVersion() !== version) return null;
      if (!response.ok || !payload?.data?.accessToken) {
        if (response.status === 401 && readSession()) clearSession();
        return null;
      }
      return saveRefreshedSession(payload.data, version) ? readSession() : null;
    } catch { return null; }
    finally { finishSessionRestore(version); }
  });
  refreshInFlight = { version, task };
  try { return await task; }
  finally { if (refreshInFlight?.task === task) refreshInFlight = null; }
}
export async function restoreSession() {
  if (needsSessionRestore()) return refreshAccessToken();
  return readSession();
}
async function ensureSession() {
  const stored = await restoreSession();
  if (!stored) return null;
  return (stored.expiresAt ?? 0) - Date.now() > 60_000 ? stored : refreshAccessToken();
}

async function request<T>(path: string, init: RequestInit, canRefresh: boolean, version: number): Promise<T> {
  const session = isAuthEndpoint(path) ? readSession() : await ensureSession();
  if (sessionVersion() !== version && path !== '/api/auth/logout') throw changedSession();
  const headers = new Headers(init.headers);
  if (session?.accessToken) headers.set('Authorization', `Bearer ${session.accessToken}`);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init, headers, credentials: 'include', cache: 'no-store', signal: init.signal ?? AbortSignal.timeout(30000),
    });
  } catch (cause) {
    if (cause instanceof Error && cause.name === 'AbortError') throw cause;
    throw new ApiError('Không kết nối được backend. Kiểm tra dịch vụ và thử lại.', 0);
  }
  if (sessionVersion() !== version && path !== '/api/auth/logout') throw changedSession();
  if (response.status === 401 && canRefresh && !isAuthEndpoint(path) && session) {
    const refreshed = readSession()?.accessToken !== session.accessToken ? readSession() : await refreshAccessToken();
    if (sessionVersion() !== version) throw changedSession();
    if (refreshed) return request<T>(path, init, false, version);
  }
  const payload = await response.json().catch(() => null);
  if (sessionVersion() !== version && path !== '/api/auth/logout') throw changedSession();
  if (!response.ok) {
    if (response.status === 401 && session && sessionVersion() === version && readSession()?.accessToken === session.accessToken) clearSession();
    const detail = payload?.message || payload?.detail;
    const fields = payload?.errors ? Object.values(payload.errors).join(' ') : '';
    throw new ApiError([typeof detail === 'string' ? detail : response.status === 403 ? 'Bạn không có quyền thực hiện thao tác này.' : 'Yêu cầu thất bại.', fields].filter(Boolean).join(' '), response.status, payload?.errors);
  }
  return (payload && Object.hasOwn(payload, 'data') ? payload.data : payload) as T;
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const version = sessionVersion();
  const work = () => request<T>(path, init, true, version);
  return changesCookie(path) ? withAuthLock(work) : work();
}
export const post = <T>(path: string, body?: unknown) => api<T>(path, { method: 'POST', ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
export interface ApiPage<T> { content: T[]; totalPages: number; totalElements: number; last: boolean; }
export async function allPages<T>(path: string): Promise<T[]> {
  const output: T[] = [];
  const version = sessionVersion();
  for (let page = 0; ; page++) {
    const result = await api<ApiPage<T>>(`${path}${path.includes('?') ? '&' : '?'}page=${page}&size=100`);
    if (sessionVersion() !== version) throw changedSession();
    output.push(...result.content);
    if (result.last || page + 1 >= result.totalPages) return output;
  }
}
export function emit(event: string) { window.dispatchEvent(new Event(event)); }
