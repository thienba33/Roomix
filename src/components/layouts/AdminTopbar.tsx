'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { label: 'Tổng quan', href: '/admin' },
  { label: 'Kiểm duyệt', href: '/admin/moderation' },
  { label: 'Người dùng', href: '/admin/users' },
  { label: 'Báo cáo', href: '/admin/reports' },
  { label: 'Thông báo & Log', href: '/admin/notifications' },
];

export default function AdminTopbar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur">
      <div className="flex h-16 w-full items-center gap-4 px-6 lg:px-12">
        <Link href="/admin" className="flex shrink-0 items-center gap-2.5">
          <Image src="/images/logo.png" alt="Roomix" width={1500} height={520} className="h-[22px] w-auto" priority />
          <span className="ml-3 rounded-full bg-primary-soft px-3 py-1.5 text-[11px] font-bold tracking-[0.08em] text-primary">ADMIN CONSOLE</span>
        </Link>
        <nav className="mx-auto hidden items-center gap-1 rounded-full bg-[#F7F7F7] p-1 lg:flex">
          {TABS.map((t) => {
            const active = t.href === '/admin' ? pathname === '/admin' : pathname.startsWith(t.href);
            return (
              <Link key={t.href} href={t.href} className={cn('whitespace-nowrap rounded-full px-4 py-2 text-sm transition', active ? 'bg-white font-semibold text-ink shadow-sm' : 'font-medium text-[#484848] hover:text-ink')}>
                {t.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-3 lg:ml-0">
          <span className="flex items-center gap-2.5 rounded-full border border-line py-1.5 pl-1.5 pr-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[13px] font-bold text-white">AD</span>
            <span className="hidden text-sm font-medium text-[#484848] sm:block">Admin</span>
          </span>
        </div>
      </div>
    </header>
  );
}
