import { api, post } from './http';
import { type AuthResponse, type SessionUser } from './session';
export { AUTH_EVENT, readSession, saveSession, clearSession, type AuthResponse, type SessionUser } from './session';
export interface RegisterRequest {
  username: string; email: string; fullName: string; phoneNumber: string;
  password: string; role: 'TENANT' | 'LANDLORD';
}
export const login = (username: string, password: string) => post<AuthResponse>('/api/auth/login', { username, password });
export const register = (request: RegisterRequest) => post<AuthResponse>('/api/auth/register', request);
export const getProfile = () => api<SessionUser>('/api/users/me');
