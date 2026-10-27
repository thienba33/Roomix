'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { readSession, saveSession } from '@/services/backend/auth';
import { API_URL } from '@/services/backend/http';
import { createAdminAuthClient, type AdminSession, type FaceLoginSession } from '@/services/admin-auth';

const client = createAdminAuthClient({
  baseUrl: API_URL,
});

const AdminAuthContext = createContext<{
  session: AdminSession | null;
  login: (username: string, password: string) => Promise<void>;
  completeFaceLogin: (ticket: FaceLoginSession, status: string, signal: AbortSignal) => Promise<void>;
  logout: () => void;
} | null>(null);

export function useAdminAuth() {
  const value = useContext(AdminAuthContext);
  if (!value) throw new Error('useAdminAuth requires AdminAuthProvider');
  return value;
}

export default function AdminAuthProvider({ children }: { children: ReactNode }) {
  const { user, ready, logout: logoutSharedSession } = useAuth();
  // Keep login provenance in memory: a restored session must authenticate by
  // password again before enrolling a face. API calls use the shared token.
  const [authenticated, setAuthenticated] = useState<AdminSession | null>(null);
  const stored = readSession();
  const session = ready && user?.role === 'ADMIN' && user.status === 'ACTIVE'
    && authenticated?.user.id === user.id && stored?.user.id === user.id
    && stored.accessToken === authenticated.accessToken && stored.expiresAt !== undefined
    ? { ...authenticated, accessToken: stored.accessToken, expiresAt: stored.expiresAt }
    : null;

  const acceptSession = (value: AdminSession) => {
    saveSession({
      accessToken: value.accessToken,
      tokenType: 'Bearer',
      expiresIn: (value.expiresAt - Date.now()) / 1000,
      user: { ...value.user, phoneNumber: value.user.phoneNumber ?? '' },
    });
    setAuthenticated(value);
  };

  const logout = () => {
    setAuthenticated(null);
    logoutSharedSession();
  };

  const login = async (username: string, password: string) => {
    setAuthenticated(null);
    acceptSession(await client.login(username, password));
  };

  const completeFaceLogin = async (ticket: FaceLoginSession, status: string, signal: AbortSignal) => {
    const authenticated = await client.completeFaceLogin(ticket, status, signal);
    if (signal.aborted) throw new DOMException('Stopped', 'AbortError');
    acceptSession(authenticated);
  };

  return <AdminAuthContext.Provider value={{ session, login, completeFaceLogin, logout }}>
    {children}
  </AdminAuthContext.Provider>;
}
