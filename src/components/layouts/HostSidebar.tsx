'use client';
import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRental } from '@/hooks/useRental';
import MobileNavigation from './MobileNavigation';
import { profileInitials } from '@/lib/tenant-store';
import { useNotifications } from '@/hooks/useNotifications';

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
      { label: 'Tổng quan', href: '/landlord', icon: IconDashboard },
      { label: 'Nhà và tầng', href: '/landlord/rooms', icon: IconBuilding },
      { label: 'Phòng và tin đăng', href: '/landlord/listings', icon: IconFile },
      { label: 'Yêu cầu', href: '/landlord/requests', icon: IconInbox, badge: 'requests' },
      { label: 'Hợp đồng', href: '/landlord/tenants', icon: IconUsers },
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
  const [collapsed, setCollapsed] = useState(false);
  const { logout, user } = useAuth();
  const { requests } = useRental();
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const { unread: unreadCount } = useNotifications();
  const badgeFor = (kind?: 'requests' | 'notifications') => (kind === 'requests' ? pendingCount : kind === 'notifications' ? unreadCount : 0);
  const isActive = (href: string) => (href === '/landlord' ? pathname === '/landlord' : pathname.startsWith(href));

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 border-b border-line bg-white lg:hidden">
        <div className="flex h-16 items-center justify-between gap-3 px-4">
          <Link href="/landlord" aria-label="Roomix"><Image src="/images/logo.png" alt="Roomix" width={1961} height={680} className="h-6 w-auto" priority /></Link>
          <p className="min-w-0 flex-1 truncate text-right text-sm font-semibold">{ALL_ITEMS.find((item) => isActive(item.href))?.label}</p>
          <MobileNavigation title="Chủ trọ" groups={[...GROUPS.map((g) => ({ title: g.title, items: g.items.map((t) => ({ label: t.label, href: t.href, count: badgeFor(t.badge) })) })), { title: 'Tài khoản', items: [{ label: 'Đăng xuất', href: '/login', onClick: logout }] }]} />
        </div>
      </div>

      {/* Desktop: left sidebar */}
      <aside className={cn('sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-white lg:flex', collapsed ? 'w-[76px]' : 'w-[232px]')}>
        <div className={cn('flex border-b border-line py-4', collapsed ? 'flex-col items-center gap-3 px-2' : 'items-center justify-between gap-2 px-4')}>
          <Link href="/landlord" aria-label="Roomix" className="inline-flex">
            {collapsed ? <Image src="/images/logo-mark.png" alt="Roomix" width={32} height={32} className="h-8 w-8 object-contain" /> : <Image src="/images/logo.png" alt="Roomix" width={1961} height={680} className="h-7 w-auto" priority />}
          </Link>

        </div>
        <nav id="host-desktop-navigation" className="flex-1 space-y-5 overflow-y-auto px-3 py-5" aria-label="Điều hướng chủ trọ">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <div className="space-y-1">
                {g.items.map((t) => {
                  const n = badgeFor(t.badge);
                  return (
                    <Link key={t.href} href={t.href} aria-current={isActive(t.href) ? 'page' : undefined} title={collapsed ? `${t.label}${n > 0 ? ` (${n})` : ''}` : undefined} className={cn('relative flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition', collapsed && 'justify-center', isActive(t.href) ? 'bg-primary-soft font-semibold text-primary' : 'font-medium text-[#484848] hover:bg-page hover:text-ink')}>
                      <t.icon />
                      <span className={collapsed ? 'sr-only' : 'flex-1'}>{t.label}</span>
                      {n > 0 && <span className={cn('flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white', collapsed && 'absolute -right-1 -top-1')}>{n > 99 ? '99+' : n}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-line p-3">
          <button type="button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'} title={collapsed ? 'Mở rộng' : 'Chỉ hiện biểu tượng'} aria-expanded={!collapsed} aria-controls="host-desktop-navigation" className={cn('flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-muted hover:bg-page hover:text-primary', collapsed ? 'justify-center' : 'w-full')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={collapsed ? 'm9 6 6 6-6 6' : 'm15 6-6 6 6 6'} /></svg>
          </button>
        </div>
        <div className="border-t border-line p-3">
          <div className={cn('flex items-center gap-1', collapsed && 'flex-col gap-3')}>
            <Link href="/landlord/profile" aria-label="Hồ sơ chủ trọ" title={collapsed ? user?.fullName ?? 'Hồ sơ' : undefined} className={cn('flex min-w-0 items-center gap-3 rounded-sm py-1.5 transition hover:bg-page', collapsed ? 'justify-center' : 'flex-1 px-2')}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-primary-soft text-[13px] font-bold text-primary">{profileInitials(user?.fullName ?? '')}</span>
              <span className={collapsed ? 'sr-only' : 'min-w-0'}>
                <span className="block truncate text-sm font-semibold text-ink">{user?.fullName ?? ''}</span>
                <span className="block text-xs text-muted">Chủ trọ</span>
              </span>
            </Link>
            <Link href="/login" onClick={logout} aria-label="Đăng xuất" title="Đăng xuất" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-[#484848] transition hover:bg-page hover:text-ink"><IconLogout /></Link>
          </div>
        </div>
      </aside>
    </>
  );
}
