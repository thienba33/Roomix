'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { landlord } from '@/lib/data';

const TABS = [
  { label: 'Hôm nay', href: '/chu-tro' },
  { label: 'Nhà & Phòng', href: '/chu-tro/phong' },
  { label: 'Bài đăng', href: '/chu-tro/bai-dang' },
  { label: 'Yêu cầu', href: '/chu-tro/yeu-cau' },
  { label: 'Khách thuê', href: '/chu-tro/khach-thue' },
  { label: 'Hóa đơn', href: '/chu-tro/hoa-don' },
  { label: 'Thống kê', href: '/chu-tro/thong-ke' },
  { label: 'Thông báo', href: '/chu-tro/thong-bao' },
];

export default function HostTopbar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur">
      <div className="flex h-16 w-full items-center gap-4 px-6 lg:px-12">
        <Link href="/chu-tro" className="flex shrink-0 items-center" aria-label="Roomix">
          <Image src="/images/logo.png" alt="Roomix" width={1500} height={520} className="h-[22px] w-auto" priority />
        </Link>
        <nav className="mx-auto hidden items-center gap-1 rounded-full bg-[#F7F7F7] p-1 lg:flex">
          {TABS.map((t) => {
            const active = t.href === '/chu-tro' ? pathname === '/chu-tro' : pathname.startsWith(t.href);
            return (
              <Link key={t.href} href={t.href} className={cn('whitespace-nowrap rounded-full px-4 py-2 text-sm transition', active ? 'bg-white font-semibold text-ink shadow-sm' : 'font-medium text-[#484848] hover:text-ink')}>
                {t.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-3 lg:ml-0">
          <Link href="/chu-tro/thong-bao" aria-label="Thông báo" className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-page">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-white" />
          </Link>
          <Link href="/chu-tro/ho-so" className="flex items-center gap-2.5 rounded-full border border-line py-1.5 pl-1.5 pr-4 transition hover:shadow">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-[13px] font-bold text-primary">{landlord.initials}</span>
            <span className="hidden text-sm font-medium text-[#484848] sm:block">{landlord.name}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
