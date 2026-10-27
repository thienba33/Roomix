'use client';

import { usePathname } from 'next/navigation';
import AdminSidebar from '@/components/layouts/AdminSidebar';
import { ToastProvider } from '@/components/ui/Toast';
import type { ReactNode } from 'react';
import Link from 'next/link';
import AdminAuthProvider, { useAdminAuth } from '@/components/auth/AdminAuthProvider';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminAuthProvider><AdminAccess>{children}</AdminAccess></AdminAuthProvider>;
}

function AdminAccess({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { session } = useAdminAuth();

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!session) {
    return <main className="mx-auto max-w-lg space-y-4 px-6 py-16">
      <h1 className="text-2xl font-bold">Khu vực quản trị</h1>
      <p>Vui lòng đăng nhập bằng tài khoản Admin để tiếp tục.</p>
      <Link href="/admin/login" className="font-semibold text-primary">Đăng nhập quản trị</Link>
    </main>;
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-white">
        <AdminSidebar />
        <main className="mx-auto w-full min-w-0 max-w-[1180px] flex-1 px-4 pb-8 pt-[88px] sm:px-6 lg:pt-8">{children}</main>
      </div>
    </ToastProvider>
  );
}
