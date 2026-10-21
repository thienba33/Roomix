'use client';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import HostSidebar from '@/components/layouts/HostSidebar';
import { ToastProvider } from '@/components/ui/Toast';

export default function ChuTroLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/landlord/login') {
    return <>{children}</>;
  }
  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-white">
        <HostSidebar />
        <main className="mx-auto w-full min-w-0 max-w-[1180px] flex-1 px-6 pb-8 pt-[104px] lg:pt-8">{children}</main>
      </div>
    </ToastProvider>
  );
}
