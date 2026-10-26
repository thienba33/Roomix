import { clearSession, readSession } from './session';

// Requests use Next's same-origin rewrite, avoiding browser CORS restrictions.
export const API_URL = '/backend';
export class ApiError extends Error {
  constructor(message: string, public status: number, public errors?: Record<string, string>) { super(message); }
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = readSession();
  const headers = new Headers(init.headers);
  if (session?.accessToken) headers.set('Authorization', `Bearer ${session.accessToken}`);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  let response: Response;
  try { response = await fetch(`${API_URL}${path}`, { ...init, headers, cache: 'no-store', signal: init.signal ?? AbortSignal.timeout(30000) }); }
  catch (cause) {
    if (cause instanceof Error && cause.name === 'AbortError') throw cause;
    throw new ApiError('Không kết nối được backend. Kiểm tra dịch vụ và thử lại.', 0);
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && session && readSession()?.accessToken === session.accessToken) clearSession();
    const detail = payload?.message || payload?.detail;
    const fields = payload?.errors ? Object.values(payload.errors).join(' ') : '';
    throw new ApiError([typeof detail === 'string' ? detail : response.status === 403 ? 'Bạn không có quyền thực hiện thao tác này.' : 'Yêu cầu thất bại.', fields].filter(Boolean).join(' '), response.status, payload?.errors);
  }
  return (payload && Object.hasOwn(payload, 'data') ? payload.data : payload) as T;
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
