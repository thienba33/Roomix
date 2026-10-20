'use client';

import { usePathname } from 'next/navigation';
import AdminTopbar from '@/components/layouts/AdminTopbar';
import type { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/admin/dang-nhap') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-white">
      <AdminTopbar />
      <main className="mx-auto max-w-[1180px] px-6 py-8">{children}</main>
    </div>
  );
}
