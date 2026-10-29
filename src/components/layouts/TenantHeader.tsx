'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  NOTIFICATIONS_EVENT,
  OPEN_AI_EVENT,
  getNotificationsEnabled,
  profileInitials,
  setNotificationsEnabled,
} from '@/lib/tenant-store';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { useAuth } from '@/components/auth/AuthProvider';
import { useAi } from './AiProvider';
import MobileNavigation from './MobileNavigation';
import NotificationPopover from './NotificationPopover';
import { useNotifications } from '@/hooks/useNotifications';

const NAV = [
  { label: 'Tìm phòng', href: '/', icon: 'm21 21-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z' },
  { label: 'Phòng yêu thích', href: '/favorites', icon: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z' },
  { label: 'Yêu cầu', href: '/requests', icon: 'M4 4h16v16H4zM8 8h8M8 12h8M8 16h4' },
  { label: 'Hợp đồng', href: '/contracts', icon: 'M14 2H6v20h12V6l-4-4ZM14 2v5h5M9 12h6M9 16h6' },
  { label: 'Hóa đơn', href: '/invoices', icon: 'M4 3v18l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V3H4ZM8 8h8M8 12h8M8 16h4' },
];

export default function TenantHeader() {
  const pathname = usePathname();
  const { signedIn, user, openAuth, logout } = useAuth();
  const [compact, setCompact] = useState<boolean | null>(null);
  const collapsed = compact ?? !signedIn;
  const navigation = signedIn ? NAV : NAV.slice(0, 1);
  const { update, reset } = useAi();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationTriggerRef = useRef<HTMLButtonElement>(null);
  const closeNotifications = useCallback(() => setNotificationsOpen(false), [setNotificationsOpen]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOn, setNotifOn] = useState(true);
  const { unread } = useNotifications();
  const menuRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(menuRef, () => setMenuOpen(false));

  // Persisted notification preference (A9) — hydrated after mount and kept
  // applied locally to this browser; no email/push delivery is configured.
  useEffect(() => {
    const sync = () => setNotifOn(getNotificationsEnabled());
    sync();
    window.addEventListener(NOTIFICATIONS_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(NOTIFICATIONS_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);


  useEffect(() => {
    const closeOverlays = () => { setNotificationsOpen(false); setMenuOpen(false); };
    window.addEventListener(OPEN_AI_EVENT, closeOverlays);
    return () => window.removeEventListener(OPEN_AI_EVENT, closeOverlays);
  }, []);

  const toggleNotif = () => {
    setNotifOn((on) => {
      setNotificationsEnabled(!on);
      return !on;
    });
  };

  return (
    <>
      <header data-collapsed={collapsed} className="tenant-header sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur lg:h-dvh lg:w-[232px] lg:shrink-0 lg:self-start lg:border-b-0 lg:border-r lg:bg-white lg:backdrop-blur-none">
        <div className="tenant-navigation-frame flex h-16 w-full items-center gap-3 px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center" aria-label="Roomix">
            <Image src="/images/logo.png" alt="Roomix" width={1961} height={680} className={cn('h-9 w-auto', collapsed && 'lg:hidden')} priority />
            {collapsed && <Image src="/images/logo-mark.png" alt="Roomix" width={32} height={32} className="hidden h-8 w-8 lg:block" />}
          </Link>

          <div className="lg:hidden">{signedIn && <MobileNavigation title="Khách thuê" groups={[{ title: 'Khám phá', items: navigation }]} />}</div>
          <nav id="tenant-navigation" className="tenant-side-nav hidden lg:flex" aria-label="Điều hướng khách thuê">
            {navigation.map((n) => {
              const active = n.href === '/' ? pathname === '/' : pathname.startsWith(n.href);
              return (
                <Link key={n.href} href={n.href} aria-label={n.label} title={collapsed ? n.label : undefined} aria-current={active ? 'page' : undefined} className={cn('flex items-center gap-3 rounded-sm px-3 py-3 text-sm transition', active ? 'bg-primary-soft font-semibold text-primary' : 'font-medium text-secondary hover:bg-page hover:text-ink')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true"><path d={n.icon} /></svg>
                  <span className="tenant-nav-label">{n.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="tenant-header-actions ml-auto flex items-center gap-4">
            <button type="button" onClick={() => setCompact(!collapsed)} className="tenant-collapse-trigger hidden h-10 items-center rounded-sm px-3 text-muted hover:bg-page hover:text-primary lg:flex" aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'} title={collapsed ? 'Mở rộng' : 'Chỉ hiện biểu tượng'} aria-expanded={!collapsed} aria-controls="tenant-navigation">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={collapsed ? 'm9 6 6 6-6 6' : 'm15 6-6 6 6 6'} /></svg>
            </button>
            {signedIn && <button
              ref={notificationTriggerRef}
              type="button"
              onClick={() => {
                setMenuOpen(false);
                if (!notificationsOpen) update({ open: false });
                setNotificationsOpen((open) => !open);
              }}
              aria-label={unread > 0 ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'}
              aria-haspopup="dialog"
              aria-expanded={notificationsOpen}
              aria-controls="tenant-notifications"
              className={cn(
                'tenant-notification-trigger relative flex h-10 w-10 items-center justify-center rounded-sm border bg-white text-ink transition hover:border-primary',
                notificationsOpen ? 'border-primary bg-primary-soft text-primary' : 'border-line',
              )}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
              <span className="tenant-nav-label hidden lg:inline">Thông báo</span>
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </button>}


            {!signedIn ? (
              <div className="tenant-auth-actions flex items-center gap-2"><button type="button" onClick={() => { closeNotifications(); update({ open: false }); openAuth('register'); }} aria-label="Đăng ký" title={collapsed ? 'Đăng ký' : undefined} className="hidden rounded-sm px-3 py-2 text-sm font-semibold text-primary sm:block"><svg className="tenant-auth-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="9" cy="7" r="4" /><path d="M2 21v-2a7 7 0 0 1 14 0v2m3-14v6m-3-3h6" /></svg><span className="tenant-auth-label">Đăng ký</span></button><button type="button" onClick={() => { closeNotifications(); update({ open: false }); openAuth(); }} className="rounded-sm bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90" aria-haspopup="dialog" aria-label="Đăng nhập" title={collapsed ? 'Đăng nhập' : undefined}>
                <svg className="tenant-auth-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M14 3h7v18h-7M3 12h13m-5-5 5 5-5 5" /></svg><span className="tenant-auth-label">Đăng nhập</span>
              </button></div>
            ) : <div className="tenant-account relative" ref={menuRef} onKeyDown={(event) => { if (event.key === 'Escape') { setMenuOpen(false); menuRef.current?.querySelector('button')?.focus(); } }}>
              <button
                onClick={() => { closeNotifications(); setMenuOpen((o) => !o); }}
                className="tenant-account-trigger flex h-10 w-10 items-center justify-center rounded-sm bg-primary-soft text-sm font-bold text-primary transition hover:ring-2 hover:ring-primary/30"
                aria-label="Menu người dùng"
                aria-expanded={menuOpen}
                aria-controls="tenant-profile-menu"
              >
                <span className="shrink-0">{profileInitials(user?.fullName ?? '')}</span>
                <span className="tenant-account-name hidden min-w-0 truncate lg:block">{user?.fullName || 'Tài khoản'}</span>
              </button>
              {menuOpen && (
                <div id="tenant-profile-menu" className="tenant-profile-menu absolute right-0 top-12 w-[min(288px,calc(100vw-32px))] overflow-hidden rounded-md border border-line bg-white py-1 shadow-lg">
                  <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 bg-page px-4 py-4 transition hover:bg-primary-soft">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-soft font-bold text-primary">{profileInitials(user?.fullName ?? '')}</span>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-ink">{user?.fullName ?? ''}</p>
                    </div>
                  </Link>
                  <div className="border-t border-line" />
                  <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-sm px-4 py-3 text-sm font-medium text-ink hover:bg-page">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    Hồ sơ của tôi
                  </Link>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifOn}
                    aria-label="Bật hoặc tắt thông báo"
                    onClick={toggleNotif}
                    className="flex w-full items-center gap-3 rounded-sm px-4 py-3 text-left text-sm font-medium text-ink transition hover:bg-page"
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                    Thông báo
                    <span className={cn('ml-auto flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition', notifOn ? 'justify-end bg-primary' : 'justify-start bg-line')}>
                      <span className="h-4 w-4 rounded-full bg-white shadow" />
                    </span>
                  </button>
                  <div className="border-t border-line" />
                  <button type="button" onClick={() => { reset(); setMenuOpen(false); logout(); }} className="flex w-full items-center gap-3 rounded-sm px-4 py-3 text-sm font-medium text-ink hover:bg-page">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></svg>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>}
          </div>
        </div>
      </header>
      {signedIn && notificationsOpen && <NotificationPopover sidebarCollapsed={collapsed} triggerRef={notificationTriggerRef} onClose={closeNotifications} />}
    </>
  );
}
