'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AdminSidebar from '@/components/layouts/AdminSidebar';
import { useAuth } from '@/components/auth/AuthProvider';
import { ToastProvider } from '@/components/ui/Toast';
import type { ReactNode } from 'react';
import AdminAuthProvider from '@/components/auth/AdminAuthProvider';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminAuthProvider><AdminAccess>{children}</AdminAccess></AdminAuthProvider>;
}

function AdminAccess({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, ready } = useAuth();

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Every admin screen, not only the login page, requires the ADMIN role.
  // Previously the shell rendered for any visitor; the moderation/users
  // components checked role themselves, but dashboard/reports/notifications
  // did not, so a non-admin could open them directly by URL.
  if (!ready) {
    return <div className="mx-auto max-w-[1180px] px-4 py-10"><p role="status" className="text-muted">Đang kiểm tra quyền quản trị…</p></div>;
  }
  if (user?.role !== 'ADMIN') {
    return <div className="mx-auto max-w-[1180px] px-4 py-10">
      <h1 className="text-2xl font-bold">Chỉ quản trị viên mới xem được trang này</h1>
      <p className="mt-2 text-sm text-muted">Đăng nhập bằng tài khoản quản trị để tiếp tục.</p>
      <Link href="/admin/login" className="mt-5 inline-block text-sm font-semibold text-primary">Đăng nhập quản trị</Link>
    </div>;
  }

  return (
    <ToastProvider>
      <div className="admin-shell flex min-h-screen bg-white">
        <AdminSidebar />
        <main className="admin-workspace mx-auto w-full min-w-0 max-w-[1600px] flex-1 px-4 pb-8 pt-[88px] sm:px-6 lg:pt-8">{children}</main>
      </div>
    </ToastProvider>
  );
}
