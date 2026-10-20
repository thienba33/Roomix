'use client';

import { usePathname } from 'next/navigation';
import AdminTopbar from '@/components/layouts/AdminTopbar';
import { ToastProvider } from '@/components/ui/Toast';
import type { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-white">
        <AdminTopbar />
        <main className="mx-auto max-w-[1180px] px-6 py-8">{children}</main>
      </div>
    </ToastProvider>
  );
}
