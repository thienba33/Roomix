'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { mergeGuestFavorites } from '@/services/mock/rooms';
import Modal from '@/components/ui/Modal';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { AUTH_EVENT, readMockSession, saveMockSession, clearMockSession, type AuthResponse, type MockUser } from '@/services/mock/auth';

type Role = 'tenant' | 'landlord';
type Mode = 'login' | 'register';
const AuthContext = createContext<{
  signedIn: boolean;
  ready: boolean;
  user: MockUser | null;
  openAuth: (mode?: Mode, role?: Role) => void;
  logout: () => void;
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
  const [favoriteError, setFavoriteError] = useState('');
  const mergeFavorites = useCallback(() => {
    try { mergeGuestFavorites(); setFavoriteError(''); }
    catch { setFavoriteError('Chưa thể gộp phòng yêu thích. Danh sách tạm vẫn được giữ, vui lòng thử lại.'); }
  }, []);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<MockUser | null>(null);
  const signedIn = user?.role === 'TENANT';
  const openAuth = useCallback((mode: Mode = 'login', role: Role = 'tenant') => setDialog({ mode, role }), []);

  useEffect(() => {
    const sync = () => { mergeFavorites(); setUser(readMockSession()?.user ?? null); setReady(true); };
    sync();
    const timer = window.setInterval(sync, 30000);
    window.addEventListener('storage', sync);
    window.addEventListener(AUTH_EVENT, sync);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('storage', sync);
      window.removeEventListener(AUTH_EVENT, sync);
    };
  }, [mergeFavorites]);

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
    clearMockSession();
    setUser(null);
    if (pathname.startsWith('/admin')) router.push('/admin/login');
    else if (pathname.startsWith('/landlord')) router.push('/login?role=landlord');
    else openAuth();
  };
  const login = (response: AuthResponse) => {
    saveMockSession(response);
    setUser(response.user);
    setDialog(null);
    if (response.user.role === 'ADMIN') router.push('/admin');
    else if (response.user.role === 'LANDLORD') router.push('/landlord');
    else if (pathname === '/login' || pathname === '/register') router.replace('/');
  };

  return (
    <AuthContext.Provider value={{ signedIn, ready, user, openAuth, logout }}>
      {favoriteError && <div role="alert" className="border-b border-line bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">{favoriteError} <button type="button" onClick={mergeFavorites} className="ml-2 font-semibold underline">Thử lại</button></div>}
      {children}
      <Modal open={!!dialog} onClose={close} title={dialog?.mode === 'register' ? 'Đăng ký' : 'Đăng nhập'} hideTitle widthClass="max-w-[480px]">
        {dialog?.mode === 'login' && <LoginForm key={`login-${dialog.role}`} initialRole={dialog.role} onSuccess={login} onRegister={(role) => openAuth('register', role)} />}
        {dialog?.mode === 'register' && <RegisterForm onSuccess={login} initialRole={dialog.role} onLogin={(role) => openAuth('login', role)} />}
      </Modal>
    </AuthContext.Provider>
  );
}
