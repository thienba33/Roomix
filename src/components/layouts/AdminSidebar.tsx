'use client';
import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/AuthProvider';
import MobileNavigation from './MobileNavigation';
import { useAdminPosts } from '@/hooks/useAdminPosts';

function I({ children }: { children: ReactNode }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden>
      {children}
    </svg>
  );
}
const IconDashboard = () => (<I><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></I>);
const IconShield = () => (<I><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></I>);
const IconUsers = () => (<I><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></I>);
const IconFlag = () => (<I><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><path d="M4 22v-7" /></I>);
const IconList = () => (<I><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></I>);
const IconLogout = () => (<I><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></I>);

const GROUPS: { title: string; items: { label: string; href: string; icon: () => ReactNode; badge?: boolean }[] }[] = [
  {
    title: 'Hệ thống',
    items: [
      { label: 'Tổng quan', href: '/admin', icon: IconDashboard },
      { label: 'Kiểm duyệt', href: '/admin/moderation', icon: IconShield, badge: true },
      { label: 'Người dùng', href: '/admin/users', icon: IconUsers },
      { label: 'Báo cáo', href: '/admin/reports', icon: IconFlag },
    ],
  },
  {
    title: 'Vận hành',
    items: [
      { label: 'Đăng ký khuôn mặt', href: '/admin/face', icon: IconShield },
      { label: 'Nhật ký hoạt động', href: '/admin/audit-logs', icon: IconList },
      { label: 'Thông báo', href: '/admin/notifications', icon: IconList },
      { label: 'Nhật ký hệ thống', href: '/admin/audit-logs', icon: IconList },
    ],
  },
];
const ALL_ITEMS = GROUPS.flatMap((g) => g.items);

export default function AdminSidebar() {
  const { logout, user } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { items } = useAdminPosts();
  const pendingCount = items.filter((r) => r.status === 'PENDING').length;
  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 border-b border-line bg-white lg:hidden">
        <div className="flex h-16 items-center justify-between gap-3 px-4">
          <Link href="/admin" aria-label="Roomix"><Image src="/images/logo.png" alt="Roomix" width={1961} height={680} className="h-6 w-auto" priority /></Link>
          <p className="min-w-0 flex-1 truncate text-right text-sm font-semibold">{ALL_ITEMS.find((item) => isActive(item.href))?.label}</p>
          <MobileNavigation title="Quản trị" groups={[...GROUPS.map((g) => ({ title: g.title, items: g.items.map((t) => ({ label: t.label, href: t.href, count: t.badge ? pendingCount : 0 })) })), { title: 'Tài khoản', items: [{ label: 'Đăng xuất', href: '/admin/login', onClick: logout }] }]} />
        </div>
      </div>

      {/* Desktop: left sidebar */}
      <aside className={cn('sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-white lg:flex', collapsed ? 'w-[76px]' : 'w-[232px]')}>
        <div className={cn('border-b border-line py-4', collapsed ? 'flex justify-center px-2' : 'px-5')}>
          <Link href="/admin" aria-label="Roomix" className="inline-flex">{collapsed ? <Image src="/images/logo-mark.png" alt="Roomix" width={32} height={32} className="h-8 w-8 object-contain" /> : <Image src="/images/logo.png" alt="Roomix" width={1961} height={680} className="h-7 w-auto" priority />}</Link>
        </div>
        <nav id="admin-desktop-navigation" className="flex-1 space-y-5 overflow-y-auto px-3 py-5" aria-label="Điều hướng Admin">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <div className="space-y-1">
                {g.items.map((t) => (
                  <Link key={t.href} href={t.href} aria-current={isActive(t.href) ? 'page' : undefined} title={collapsed ? t.label : undefined} className={cn('relative flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition', collapsed && 'justify-center', isActive(t.href) ? 'bg-primary-soft font-semibold text-primary' : 'font-medium text-[#484848] hover:bg-page hover:text-ink')}>
                    <t.icon />
                    <span className={collapsed ? 'sr-only' : 'flex-1'}>{t.label}</span>
                    {t.badge && pendingCount > 0 && <span aria-label={`${pendingCount} bài chờ kiểm duyệt`} className={cn('flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[11px] font-bold text-white', collapsed && 'absolute -right-1 -top-1')}>{pendingCount > 99 ? '99+' : pendingCount}</span>}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-line p-3">
          <button type="button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'} title={collapsed ? 'Mở rộng' : 'Chỉ hiện biểu tượng'} aria-expanded={!collapsed} aria-controls="admin-desktop-navigation" className={cn('flex items-center rounded-sm px-3 py-2.5 text-muted hover:bg-page hover:text-primary', collapsed ? 'justify-center' : 'w-full')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={collapsed ? 'm9 6 6 6-6 6' : 'm15 6-6 6 6 6'} /></svg>
          </button>
        </div>
        <div className="border-t border-line p-3">
          <div className={cn('flex items-center gap-1', collapsed && 'flex-col gap-3')}>
            <div title={collapsed ? user?.fullName ?? 'Admin' : undefined} className={cn('flex min-w-0 items-center gap-3 py-1.5', collapsed ? 'justify-center' : 'flex-1 px-2')}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-ink text-[13px] font-bold text-white">AD</span>
              <span className={collapsed ? 'sr-only' : 'min-w-0'}>
                <span className="block truncate text-sm font-semibold text-ink">{user?.fullName ?? 'Admin'}</span>
                <span className="block text-xs text-muted">Quản trị viên</span>
              </span>
            </div>
            <Link href="/admin/login" onClick={logout} aria-label="Đăng xuất" title="Đăng xuất" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-[#484848] transition hover:bg-page hover:text-ink"><IconLogout /></Link>
          </div>
        </div>
      </aside>
    </>
  );
}
