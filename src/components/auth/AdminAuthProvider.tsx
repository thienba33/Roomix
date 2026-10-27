'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createAdminAuthClient, type AdminSession, type FaceLoginSession } from '@/services/admin-auth';

const client = createAdminAuthClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:18080',
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
  // JWT chỉ nằm trong bộ nhớ, không đưa vào kho localStorage của bản mock.
  // Tải lại toàn trang sẽ yêu cầu đăng nhập lại cho đến khi Core có refresh/session API.
  const [session, setSession] = useState<AdminSession | null>(null);

  useEffect(() => {
    if (!session) return;
    const timer = window.setInterval(() => {
      if (Date.now() >= session.expiresAt) setSession(null);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [session]);

  const login = async (username: string, password: string) => {
    setSession(null);
    setSession(await client.login(username, password));
  };

  const completeFaceLogin = async (ticket: FaceLoginSession, status: string, signal: AbortSignal) => {
    const authenticated = await client.completeFaceLogin(ticket, status, signal);
    if (signal.aborted) throw new DOMException('Stopped', 'AbortError');
    setSession(authenticated);
  };

  return <AdminAuthContext.Provider value={{ session, login, completeFaceLogin, logout: () => setSession(null) }}>
    {children}
  </AdminAuthContext.Provider>;
}
