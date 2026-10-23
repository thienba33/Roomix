'use client';
import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { useDialogFocus } from '@/hooks/useDialogFocus';

interface Item { label: string; href: string; count?: number; onClick?: () => void; }
export default function MobileNavigation({ title, groups }: { title: string; groups: { title: string; items: Item[]; }[]; }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDialogFocus(ref, open, close);
  return <>
    <button onClick={() => setOpen(true)} aria-label={`Mở menu ${title}`} aria-expanded={open} className="flex h-10 items-center gap-2 rounded-xl border border-line px-3 text-sm font-semibold">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
      <span className="hidden sm:inline">Menu</span>
    </button>
    {open && createPortal(<div className="fixed inset-0 z-[100] bg-black/30" onClick={close}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={`Điều hướng ${title}`} tabIndex={-1} className="absolute inset-y-0 left-0 flex w-[min(320px,90vw)] flex-col overflow-y-auto bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <p className="font-bold">{title}</p>
          <button onClick={close} aria-label="Đóng menu" className="h-10 w-10 rounded-full hover:bg-page">✕</button>
        </div>
        {groups.map((group) => <div key={group.title} className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{group.title}</p>{group.items.map((item) => {
            const active = pathname === item.href || (item.href.split('/').length > 2 && pathname.startsWith(item.href));
            return <Link key={item.href} href={item.href} onClick={() => { close(); item.onClick?.(); }} aria-current={active ? 'page' : undefined} className={`mb-1 flex items-center justify-between rounded-xl px-3 py-3 text-sm ${active ? 'bg-primary-soft font-semibold text-primary' : 'text-secondary hover:bg-page'}`}>{item.label}{!!item.count && <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs text-primary">{item.count}</span>}</Link>;
          })}</div>)}
      </div>
    </div>, document.body)}
  </>;
}
