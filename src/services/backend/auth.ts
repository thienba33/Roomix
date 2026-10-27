import { api, post } from './http';
import { type AuthResponse, type SessionUser } from './session';
export { AUTH_EVENT, readSession, saveSession, clearSession, type AuthResponse, type SessionUser } from './session';
export interface RegisterRequest {
  username: string; email: string; fullName: string; phoneNumber: string;
  password: string; role: 'TENANT' | 'LANDLORD';
}
export interface ForgotPasswordRequest { email: string; }
export interface ResetPasswordRequest { token: string; newPassword: string; confirmPassword: string; }
export const login = (username: string, password: string) => post<AuthResponse>('/api/auth/login', { username, password });
export const register = (request: RegisterRequest) => post<AuthResponse>('/api/auth/register', request);
export const refreshSession = () => post<AuthResponse>('/api/auth/refresh');
export const logoutSession = () => post<void>('/api/auth/logout');
export const getProfile = () => api<SessionUser>('/api/users/me');
export const forgotPassword = (email: string) => post<void>('/api/auth/forgot-password', { email });
export const resetPassword = (request: ResetPasswordRequest) => post<void>('/api/auth/reset-password', request);
