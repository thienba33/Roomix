'use client';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import HostSidebar from '@/components/layouts/HostSidebar';
import { ToastProvider } from '@/components/ui/Toast';

export default function ChuTroLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, ready, openAuth } = useAuth();
  if (pathname === '/landlord/login') {
    return <>{children}</>;
  }
  if (!ready) return <p className="p-8 text-muted">Đang tải tài khoản…</p>;
  if (!user || user.role !== 'LANDLORD') return <main className="mx-auto max-w-lg space-y-4 px-6 py-16"><h1 className="text-2xl font-bold">Khu vực chủ trọ</h1><p>{user ? 'Tài khoản hiện tại không có quyền truy cập khu vực này.' : 'Đăng nhập bằng tài khoản chủ trọ để tiếp tục.'}</p>{!user && <Button onClick={() => openAuth('login', 'landlord')}>Đăng nhập chủ trọ</Button>}<Link href="/" className="block text-primary">Về trang chủ</Link></main>;
  return (
    <ToastProvider>
      <div className="host-shell flex min-h-screen bg-white">
        <HostSidebar />
        <main className="host-workspace mx-auto w-full min-w-0 max-w-[1600px] flex-1 px-4 pb-8 pt-[88px] sm:px-6 lg:pt-8">{children}</main>
      </div>
    </ToastProvider>
  );
}
