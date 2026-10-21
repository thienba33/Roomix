'use client';

import { usePathname } from 'next/navigation';
import AdminSidebar from '@/components/layouts/AdminSidebar';
import { ToastProvider } from '@/components/ui/Toast';
import type { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-white">
        <AdminSidebar />
        <main className="mx-auto w-full min-w-0 max-w-[1180px] flex-1 px-6 pb-8 pt-[104px] lg:pt-8">{children}</main>
      </div>
    </ToastProvider>
  );
}
