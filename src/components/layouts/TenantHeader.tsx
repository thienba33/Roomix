'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { tenantUser } from '@/lib/data';
import {
  NOTIFICATIONS_EVENT,
  PROFILE_EVENT,
  getNotificationsEnabled,
  getTenantProfile,
  getUnreadNotificationCount,
  profileInitials,
  setNotificationsEnabled,
  type TenantProfile,
} from '@/lib/tenant-store';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { useAi } from './AiProvider';
import MobileNavigation from './MobileNavigation';

const NAV = [
  { label: 'Tìm phòng', href: '/' },
  { label: 'Phòng yêu thích', href: '/favorites' },
  { label: 'Yêu cầu của tôi', href: '/requests' },
];

export default function TenantHeader() {
  const pathname = usePathname();
  const { state: { open: aiOpen }, update, reset } = useAi();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOn, setNotifOn] = useState(true);
  const [unread, setUnread] = useState(0);
  const [profile, setProfile] = useState<TenantProfile>({ name: tenantUser.name, phone: tenantUser.phone, address: '' });
  const menuRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(menuRef, () => setMenuOpen(false));

  // Persisted notification preference (A9) — hydrated after mount and kept
  // in sync with the master switch on /profile (same store key + event).
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

  // Unread badge on the bell — driven by the same tenant notification store
  // the /notifications page writes to; resynced on navigation too.
  useEffect(() => {
    const sync = () => setUnread(getUnreadNotificationCount());
    sync();
    window.addEventListener(NOTIFICATIONS_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(NOTIFICATIONS_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [pathname]);

  // Display name follows the editable profile (UC01.4) when it changes.
  useEffect(() => {
    const sync = () => setProfile(getTenantProfile());
    sync();
    window.addEventListener(PROFILE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(PROFILE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const toggleNotif = () => {
    setNotifOn((on) => {
      setNotificationsEnabled(!on);
      return !on;
    });
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur">
        <div className="flex h-16 w-full items-center gap-3 px-4 sm:px-6 lg:gap-8 lg:px-12">
          <Link href="/" className="flex shrink-0 items-center" aria-label="Roomix">
            <Image src="/images/logo.png" alt="Roomix" width={1961} height={680} className="h-6 w-auto" priority />
          </Link>

          <div className="md:hidden"><MobileNavigation title="Khách thuê" groups={[{ title: 'Khám phá', items: NAV }]} /></div>
          <nav className="hidden items-center gap-7 md:flex">
            {NAV.map((n) => {
              const active = n.href === '/' ? pathname === '/' : pathname.startsWith(n.href);
              return (
                <Link key={n.href} href={n.href} className={cn('text-sm transition', active ? 'font-bold text-ink' : 'font-medium text-muted hover:text-ink')}>
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/notifications"
              aria-label={unread > 0 ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'}
              className={cn(
                'relative flex h-10 w-10 items-center justify-center rounded-full border bg-white text-ink transition hover:shadow',
                pathname.startsWith('/notifications') ? 'border-sea shadow' : 'border-line',
              )}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#DC2626] px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {unread}
                </span>
              )}
            </Link>

            <button
              onClick={() => update({ open: !aiOpen })}
              aria-label={aiOpen ? 'Đóng Roomix AI' : 'Mở Roomix AI'}
              aria-expanded={aiOpen}
              aria-controls="roomix-ai"
              className={cn('flex h-10 items-center justify-center gap-2 rounded-full border bg-white px-3 text-sm font-semibold text-primary transition hover:bg-primary-soft', aiOpen ? 'border-sea shadow' : 'border-line')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M21 11a8 8 0 0 1-8 8H5l-3 3V11a9 9 0 0 1 19 0Z" /><path d="M7 10h9M7 14h6" /></svg><span className="hidden sm:inline">Hỏi AI</span>
            </button>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary transition hover:ring-2 hover:ring-primary/30"
                aria-label="Menu người dùng"
              >
                {profileInitials(profile.name)}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-12 w-[300px] rounded-2xl border border-line bg-white p-2 shadow-2xl">
                  <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-page">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft font-bold text-primary">{profileInitials(profile.name)}</span>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-ink">{profile.name}</p>
                    </div>
                  </Link>
                  <div className="border-t border-line" />
                  <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-page">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    Hồ sơ của tôi
                  </Link>
                                                      <button
                    type="button"
                    role="switch"
                    aria-checked={notifOn}
                    aria-label="Bật hoặc tắt thông báo"
                    onClick={toggleNotif}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink transition hover:bg-page"
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                    Thông báo <span className="text-muted">· {notifOn ? 'Bật' : 'Tắt'}</span>
                    <span className={cn('ml-auto flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition', notifOn ? 'justify-end bg-primary' : 'justify-start bg-line')}>
                      <span className="h-4 w-4 rounded-full bg-white shadow" />
                    </span>
                  </button>
                  <div className="border-t border-line" />
                  <Link href="/login" onClick={() => { reset(); setMenuOpen(false); }} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-page">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></svg>
                    Đăng xuất
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

    </>
  );
}
