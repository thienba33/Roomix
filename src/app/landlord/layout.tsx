'use client';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import HostTopbar from '@/components/layouts/HostTopbar';
import { ToastProvider } from '@/components/ui/Toast';

export default function ChuTroLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/landlord/login') {
    return <>{children}</>;
  }
  return (
    <ToastProvider>
      <HostTopbar />
      <main className="mx-auto max-w-[1180px] px-6 py-8">{children}</main>
    </ToastProvider>
  );
}
