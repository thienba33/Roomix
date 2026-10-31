import { api, post } from './http';
import { type AuthResponse, type SessionUser } from './session';
export { AUTH_EVENT, readSession, saveSession, updateSessionUser, clearSession, type AuthResponse, type SessionUser } from './session';
export interface RegisterRequest {
  username: string; email: string; fullName: string; phoneNumber: string;
  password: string; role: 'TENANT' | 'LANDLORD';
}
export interface ForgotPasswordRequest { email: string; }
export interface ResetPasswordRequest { token: string; newPassword: string; confirmPassword: string; }
export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber: string;
  avatarUrl: string | null;
  zalo: string | null;
}
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
export interface LandlordContact {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  joinedAt: string;
}
export const PROFILE_EVENT = 'roomix:profile';
export const login = (username: string, password: string) => post<AuthResponse>('/api/auth/login', { username, password });
export const register = (request: RegisterRequest) => post<AuthResponse>('/api/auth/register', request);
export const logoutSession = () => post<void>('/api/auth/logout');
export const getProfile = () => api<SessionUser>('/api/users/me');
export async function updateProfile(request: UpdateProfileRequest) {
  const profile = await api<SessionUser>('/api/users/me', {
    method: 'PUT',
    body: JSON.stringify(request),
  });
  window.dispatchEvent(new Event(PROFILE_EVENT));
  return profile;
}
export const getLandlordContact = (landlordId: string) =>
  api<LandlordContact>(`/api/users/landlords/${encodeURIComponent(landlordId)}`);
export const changePassword = (request: ChangePasswordRequest) =>
  post<void>('/api/auth/change-password', request);
export const forgotPassword = (email: string) => post<void>('/api/auth/forgot-password', { email });
export const resetPassword = (request: ResetPasswordRequest) => post<void>('/api/auth/reset-password', request);
