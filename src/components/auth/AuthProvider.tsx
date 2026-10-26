'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import LoginForm from './LoginForm';
import AuthScene from './AuthScene';
import RegisterForm from './RegisterForm';
import { AUTH_EVENT, getProfile, readSession, saveSession, clearSession, type AuthResponse, type SessionUser } from '@/services/backend/auth';

type Role = 'tenant' | 'landlord';
type Mode = 'login' | 'register';
const AuthContext = createContext<{
  signedIn: boolean;
  ready: boolean;
  user: SessionUser | null;
  openAuth: (mode?: Mode, role?: Role) => void;
  logout: () => void;
  requireTenant: () => boolean;
} | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth requires AuthProvider');
  return context;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [dialog, setDialog] = useState<{ mode: Mode; role: Role } | null>(null);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const signedIn = user?.role === 'TENANT';
  const openAuth = useCallback((mode: Mode = 'login', role: Role = 'tenant') => { setDialog({ mode, role }); }, []);
  const requireTenant = () => {
    const currentUser = readSession()?.user ?? null;
    if (currentUser?.role === 'TENANT') return true;
    setUser(currentUser);
    openAuth('login', 'tenant');
    return false;
  };

  useEffect(() => {
    let active = true;
    let generation = 0;
    let previousToken = '';
    const sync = async () => {
      const current = ++generation;
      const session = readSession();
      if (!session) { setUser(null); setReady(true); if (previousToken) { previousToken = ''; clearSession(); } return; }
      const changed = previousToken !== session.accessToken;
      previousToken = session.accessToken ?? '';
      if (changed) { setUser(null); setReady(false); }
      try {
        const profile = await getProfile();
        if (profile.status !== 'ACTIVE' && readSession()?.accessToken === session.accessToken) { clearSession(); return; }
        if (active && current === generation && readSession()?.accessToken === session.accessToken) { setUser(profile); setReady(true); }
      } catch {
        if (active && current === generation) { setUser(null); setReady(true); }
      }
    };
    sync();
    const timer = window.setInterval(sync, 30000);
    window.addEventListener('storage', sync);
    window.addEventListener(AUTH_EVENT, sync);
    return () => {
      active = false; generation++;
      window.clearInterval(timer);
      window.removeEventListener('storage', sync);
      window.removeEventListener(AUTH_EVENT, sync);
    };
  }, []);

  useEffect(() => {
    if (pathname === '/login' || pathname === '/register') {
      const role = new URLSearchParams(window.location.search).get('role') === 'landlord' ? 'landlord' : 'tenant';
      // Synchronize the legacy URL with the global dialog after browser hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      openAuth(pathname === '/register' ? 'register' : 'login', role);
    } else {
      setDialog(null);
    }
  }, [pathname, openAuth]);

  const close = () => {
    setDialog(null);
    if (pathname === '/login' || pathname === '/register') router.replace('/', { scroll: false });
  };
  const logout = () => {
    clearSession();
    setUser(null);
    if (pathname.startsWith('/admin')) router.push('/admin/login');
    else if (pathname.startsWith('/landlord')) router.push('/login?role=landlord');
    else router.push('/');
  };
  const login = (response: AuthResponse) => {
    saveSession(response);
    setUser(response.user);
    setDialog(null);
    if (response.user.role === 'ADMIN') router.push('/admin');
    else if (response.user.role === 'LANDLORD') router.push('/landlord');
    else if (pathname === '/login' || pathname === '/register') router.replace('/');
  };

  return (
    <AuthContext.Provider value={{ signedIn, ready, user, openAuth, logout, requireTenant }}>
      {children}
      <Modal open={!!dialog} onClose={close} title={dialog?.mode === 'register' ? 'Đăng ký' : 'Đăng nhập'} hideTitle widthClass="max-w-[480px] md:max-w-[960px]" contentClassName="auth-dialog">
        <AuthScene>
        {dialog?.mode === 'login' && <LoginForm key={`login-${dialog.role}`} initialRole={dialog.role} onSuccess={login} onRegister={(role) => openAuth('register', role)} />}
        {dialog?.mode === 'register' && <RegisterForm onBrowse={close} onSuccess={login} initialRole={dialog.role} onLogin={(role) => openAuth('login', role)} />}
        </AuthScene>
      </Modal>
    </AuthContext.Provider>
  );
}
