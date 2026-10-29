'use client';
import { useRef, type RefObject } from 'react';
import Link from 'next/link';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import Notifications from '@/components/account/Notifications';
export default function NotificationPopover({ triggerRef, onClose, sidebarCollapsed = false }: { sidebarCollapsed?: boolean; triggerRef: RefObject<HTMLButtonElement | null>; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogFocus(ref, true, () => { onClose(); triggerRef.current?.focus(); });
  return <div data-sidebar-collapsed={sidebarCollapsed} className="tenant-notification-overlay fixed inset-0 z-[60] bg-black/20" onClick={onClose}>
    <div id="tenant-notifications" ref={ref} role="dialog" aria-modal="true" aria-label="Thông báo" tabIndex={-1} onClick={(event) => event.stopPropagation()} className="notification-popup tenant-notification-popup absolute right-4 top-[72px] max-h-[calc(100dvh-88px)] w-[min(460px,calc(100vw-32px))] overflow-y-auto rounded-md border border-line bg-white shadow-lg sm:right-6 lg:right-12">
      <Notifications headerAction={<button type="button" aria-label="Đóng thông báo" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-sm text-muted hover:bg-page">✕</button>} />
      <Link href="/notifications" onClick={onClose} className="block border-t border-line px-5 py-4 text-center text-sm font-semibold text-primary hover:bg-page">Xem tất cả thông báo</Link>
    </div>
  </div>;
}
