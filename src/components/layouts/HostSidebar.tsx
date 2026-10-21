'use client';
import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import MobileNavigation from './MobileNavigation';
import { landlord, house } from '@/lib/data';
import { pendingRequestCountFromStorage, unreadCountFromStorage } from '@/lib/landlord-store';

function I({ d, children }: { d?: string; children?: ReactNode }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden>
      {d ? <path d={d} /> : children}
    </svg>
  );
}
const IconDashboard = () => (<I><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></I>);
const IconBuilding = () => (<I><path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" /><path d="M16 9h3a1 1 0 0 1 1 1v11" /><path d="M2 21h20" /><path d="M8 7h2M8 11h2M8 15h2M12 7h0M12 11h0M12 15h0" /></I>);
const IconFile = () => (<I><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 13h6M9 17h6" /></I>);
const IconInbox = () => (<I><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></I>);
const IconUsers = () => (<I><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></I>);
const IconReceipt = () => (<I><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" /><path d="M8 8h8M8 12h8" /></I>);
const IconChart = () => (<I><path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="M8 16v-5M13 16V8M18 16v-8" /></I>);
const IconBell = () => (<I><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></I>);
const IconUser = () => (<I><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" /></I>);
const IconLogout = () => (<I><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></I>);

const GROUPS: { title: string; items: { label: string; href: string; icon: () => ReactNode; badge?: 'requests' | 'notifications' }[] }[] = [
  {
    title: 'Quản lý',
    items: [
      { label: 'Hôm nay', href: '/landlord', icon: IconDashboard },
      { label: 'Nhà & Phòng', href: '/landlord/rooms', icon: IconBuilding },
      { label: 'Bài đăng', href: '/landlord/listings', icon: IconFile },
      { label: 'Yêu cầu', href: '/landlord/requests', icon: IconInbox, badge: 'requests' },
      { label: 'Khách thuê', href: '/landlord/tenants', icon: IconUsers },
      { label: 'Hóa đơn', href: '/landlord/invoices', icon: IconReceipt },
      { label: 'Thống kê', href: '/landlord/statistics', icon: IconChart },
    ],
  },
  {
    title: 'Cá nhân',
    items: [
      { label: 'Thông báo', href: '/landlord/notifications', icon: IconBell, badge: 'notifications' },
      { label: 'Hồ sơ', href: '/landlord/profile', icon: IconUser },
    ],
  },
];
const ALL_ITEMS = GROUPS.flatMap((g) => g.items);

export default function HostSidebar() {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => { const refresh = () => { try { setPendingCount(pendingRequestCountFromStorage()); setUnreadCount(unreadCountFromStorage()); } catch {} }; refresh(); const id = setInterval(refresh, 1500); window.addEventListener('storage', refresh); window.addEventListener('focus', refresh); return () => { clearInterval(id); window.removeEventListener('storage', refresh); window.removeEventListener('focus', refresh); }; }, [pathname]);
  const badgeFor = (kind?: 'requests' | 'notifications') => (kind === 'requests' ? pendingCount : kind === 'notifications' ? unreadCount : 0);
  const isActive = (href: string) => (href === '/landlord' ? pathname === '/landlord' : pathname.startsWith(href));

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 border-b border-line bg-white lg:hidden">
        <div className="flex h-16 items-center justify-between gap-3 px-4">
          <Link href="/landlord" aria-label="Roomix"><Image src="/images/logo.png" alt="Roomix" width={1961} height={680} className="h-6 w-auto" priority /></Link>
          <p className="min-w-0 flex-1 truncate text-right text-sm font-semibold">{ALL_ITEMS.find((item) => isActive(item.href))?.label}</p>
          <MobileNavigation title="Chủ trọ" groups={[...GROUPS.map((g) => ({ title: g.title, items: g.items.map((t) => ({ label: t.label, href: t.href, count: badgeFor(t.badge) })) })), { title: 'Tài khoản', items: [{ label: 'Đăng xuất', href: '/landlord/login' }] }]} />
        </div>
      </div>

      {/* Desktop: left sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col border-r border-line bg-white lg:flex">
        <div className="border-b border-line px-5 pb-4 pt-5">
          <Link href="/landlord" aria-label="Roomix" className="inline-flex"><Image src="/images/logo.png" alt="Roomix" width={1961} height={680} className="h-7 w-auto" priority /></Link>
          <p className="mt-2 text-xs text-muted">{house.name}</p>
        </div>
        <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-5" aria-label="Điều hướng chủ trọ">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <p className="px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#9A9A9A]">{g.title}</p>
              <div className="mt-2 space-y-1">
                {g.items.map((t) => {
                  const n = badgeFor(t.badge);
                  return (
                    <Link key={t.href} href={t.href} aria-current={isActive(t.href) ? 'page' : undefined} className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition', isActive(t.href) ? 'bg-primary-soft font-semibold text-primary' : 'font-medium text-[#484848] hover:bg-page hover:text-ink')}>
                      <t.icon />
                      <span className="flex-1">{t.label}</span>
                      {n > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">{n}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-line p-3">
          <div className="flex items-center gap-1">
            <Link href="/landlord/profile" className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-page">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[13px] font-bold text-primary">{landlord.initials}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">{landlord.name}</span>
                <span className="block text-xs text-muted">Chủ trọ</span>
              </span>
            </Link>
            <Link href="/landlord/login" aria-label="Đăng xuất" title="Đăng xuất" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#484848] transition hover:bg-page hover:text-ink"><IconLogout /></Link>
          </div>
        </div>
      </aside>
    </>
  );
}
