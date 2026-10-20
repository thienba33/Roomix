'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { label: 'Tổng quan', href: '/admin' },
  { label: 'Kiểm duyệt', href: '/admin/kiem-duyet' },
  { label: 'Người dùng', href: '/admin/nguoi-dung' },
  { label: 'Báo cáo', href: '/admin/bao-cao' },
  { label: 'Thông báo & Log', href: '/admin/thong-bao' },
];

export default function AdminTopbar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-6">
        <Link href="/admin" className="flex shrink-0 items-center gap-2.5">
          <Image src="/images/logo.png" alt="Roomix" width={28} height={28} className="h-7 w-7 object-contain" />
          <span className="text-base font-extrabold tracking-tight text-ink">Room<span className="text-primary">ix</span></span>
          <span className="rounded-md bg-primary-soft px-2 py-1 text-[11px] font-bold tracking-wider text-primary-dark">ADMIN CONSOLE</span>
        </Link>
        <nav className="mx-auto hidden items-center gap-1 lg:flex">
          {TABS.map((t) => {
            const active = t.href === '/admin' ? pathname === '/admin' : pathname.startsWith(t.href);
            return (
              <Link key={t.href} href={t.href} className={cn('whitespace-nowrap rounded-full px-3.5 py-2 text-sm transition', active ? 'bg-primary-soft font-bold text-primary' : 'font-medium text-muted hover:bg-page hover:text-ink')}>
                {t.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-3 lg:ml-0">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">AD</span>
        </div>
      </div>
    </header>
  );
}
