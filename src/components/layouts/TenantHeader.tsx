'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { tenantUser } from '@/lib/data';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import AiPanel from './AiPanel';

const NAV = [
  { label: 'Tìm phòng', href: '/' },
  { label: 'Phòng yêu thích', href: '/yeu-thich' },
  { label: 'Yêu cầu của tôi', href: '/yeu-cau' },
];

export default function TenantHeader({ defaultAiOpen = false }: { defaultAiOpen?: boolean }) {
  const pathname = usePathname();
  const [aiOpen, setAiOpen] = useState(defaultAiOpen);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(menuRef, () => setMenuOpen(false));

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Image src="/images/logo.png" alt="Roomix" width={30} height={30} className="h-[30px] w-[30px] object-contain" />
            <span className="text-lg font-extrabold tracking-tight text-ink">Room<span className="text-primary">ix</span></span>
          </Link>

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

          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => setAiOpen((o) => !o)}
              aria-label="Mở Roomix AI"
              className={cn('flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border bg-white transition hover:shadow', aiOpen ? 'border-sea shadow' : 'border-line')}
            >
              <Image src="/images/ai-icon.png" alt="AI" width={24} height={24} />
            </button>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary transition hover:ring-2 hover:ring-primary/30"
                aria-label="Menu người dùng"
              >
                {tenantUser.initials}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-12 w-[300px] rounded-2xl border border-line bg-white p-2 shadow-2xl">
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft font-bold text-primary">{tenantUser.initials}</span>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-ink">{tenantUser.name}</p>
                      <p className="truncate text-[13px] text-muted">{tenantUser.email}</p>
                    </div>
                  </div>
                  <div className="space-y-1 px-3 pb-2 text-[13px] text-muted">
                    <p><span className="mr-1.5 font-bold text-primary">✓</span>Email đã xác minh</p>
                    <p><span className="mr-1.5 font-bold text-primary">✓</span>{tenantUser.phone} đã xác minh</p>
                  </div>
                  <div className="border-t border-line" />
                  <Link href="/yeu-cau" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-page">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h10" /></svg>
                    Yêu cầu của tôi
                  </Link>
                  <Link href="/yeu-thich" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-page">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                    Phòng yêu thích
                  </Link>
                  <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                    Thông báo <span className="text-muted">· Bật</span>
                  </div>
                  <div className="border-t border-line" />
                  <Link href="/login" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-page">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></svg>
                    Đăng xuất
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      {aiOpen && <AiPanel onClose={() => setAiOpen(false)} />}
    </>
  );
}
