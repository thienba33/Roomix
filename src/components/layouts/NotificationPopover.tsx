'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  NOTIFICATIONS_EVENT,
  getNotificationsEnabled,
  getTenantNotifications,
  setTenantNotifications,
} from '@/lib/tenant-store';
import type { NotificationItem, NotificationType } from '@/types';
import { useDialogFocus } from '@/hooks/useDialogFocus';

const DOT_COLORS: Record<NotificationType, string> = {
  INTEREST_REQUEST: 'bg-amber-600',
  INVOICE: 'bg-red-600',
  POST_APPROVAL: 'bg-green-600',
  SYSTEM: 'bg-primary',
  GENERAL: 'bg-muted',
};

interface Props {
  triggerRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}

export default function NotificationPopover({ triggerRef, onClose }: Props) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [undoReadIds, setUndoReadIds] = useState<number[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [mobile, setMobile] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef(true);
  const close = useCallback(() => onClose(), [onClose]);
  useDialogFocus(panelRef, mobile, close);

  useEffect(() => {
    const sync = () => {
      setItems(getTenantNotifications());
      setEnabled(getNotificationsEnabled());
    };
    const media = window.matchMedia('(max-width: 639px)');
    const resize = () => setMobile(media.matches);
    sync();
    resize();
    window.addEventListener(NOTIFICATIONS_EVENT, sync);
    window.addEventListener('storage', sync);
    media.addEventListener('change', resize);
    return () => {
      window.removeEventListener(NOTIFICATIONS_EVENT, sync);
      window.removeEventListener('storage', sync);
      media.removeEventListener('change', resize);
    };
  }, []);

  useEffect(() => {
    const panel = panelRef.current;
    const trigger = triggerRef.current;
    panel?.focus({ preventScroll: true });
    const outside = (event: PointerEvent) => {
      if (panel?.contains(event.target as Node) || trigger?.contains(event.target as Node)) return;
      restoreFocus.current = false;
      close();
    };
    const escape = (event: KeyboardEvent) => {
      // The shared dialog hook handles Escape on mobile and for nested dialogs.
      if (event.key !== 'Escape' || document.querySelector('[aria-modal="true"]')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      close();
    };
    const blur = (event: FocusEvent) => {
      if (!event.relatedTarget || panel?.contains(event.relatedTarget as Node) || trigger?.contains(event.relatedTarget as Node)) return;
      restoreFocus.current = false;
      close();
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape, true);
    panel?.addEventListener('focusout', blur);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape, true);
      panel?.removeEventListener('focusout', blur);
      if (restoreFocus.current && trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [close, triggerRef]);

  const unread = items.filter((item) => !item.read).length;
  const visible = onlyUnread ? items.filter((item) => !item.read) : items;
  const markRead = (id: number) => {
    setUndoReadIds([]);
    const latest = getTenantNotifications();
    setTenantNotifications(latest.map((item) => item.id === id ? { ...item, read: true } : item));
  };
  const markAllRead = () => {
    const before = getTenantNotifications();
    setUndoReadIds(before.filter((item) => !item.read).map((item) => item.id));
    setTenantNotifications(before.map((item) => ({ ...item, read: true })));
  };
  const undoMarkAllRead = () => {
    const latest = getTenantNotifications();
    setTenantNotifications(latest.map((item) => undoReadIds.includes(item.id) ? { ...item, read: false } : item));
    setUndoReadIds([]);
  };

  return createPortal(
    <div
      id="tenant-notifications"
      ref={panelRef}
      role="dialog"
      aria-modal={mobile || undefined}
      aria-labelledby="notifications-heading"
      tabIndex={-1}
      style={{
        position: 'fixed',
        inset: `${mobile ? 76 : 80}px ${mobile ? 16 : 48}px auto auto`,
        zIndex: 60,
        width: 'min(520px, calc(100vw - 32px))',
        maxHeight: `min(680px, calc(100dvh - ${mobile ? 96 : 104}px))`,
      }}
      className="flex flex-col overflow-hidden rounded-[28px] border border-line bg-white shadow-[0_16px_64px_rgba(34,34,34,0.14)] outline-none"
    >
      <div className="shrink-0 px-5 pb-4 pt-5 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="notifications-heading" className="text-xl font-bold tracking-tight text-ink">Thông báo</h2>
            <p aria-live="polite" className="mt-1 text-sm text-muted">
              {unread > 0 ? `Bạn có ${unread} thông báo chưa đọc` : 'Bạn đã đọc hết thông báo'}
            </p>
          </div>
          <button type="button" onClick={close} aria-label="Đóng thông báo" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-page hover:text-ink">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><path d="m6 6 12 12M6 18 18 6" /></svg>
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 rounded-full bg-page p-1" role="group" aria-label="Lọc thông báo">
            <button type="button" onClick={() => setOnlyUnread(false)} aria-pressed={!onlyUnread} className={cn('rounded-full px-3 py-1.5 text-xs font-semibold transition', !onlyUnread ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink')}>Tất cả · {items.length}</button>
            <button type="button" onClick={() => setOnlyUnread(true)} aria-pressed={onlyUnread} className={cn('rounded-full px-3 py-1.5 text-xs font-semibold transition', onlyUnread ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink')}>Chưa đọc · {unread}</button>
          </div>
          {unread > 0 ? (
            <button type="button" onClick={markAllRead} className="rounded-lg py-1.5 text-xs font-semibold text-primary hover:underline">Đọc tất cả</button>
          ) : undoReadIds.length > 0 && (
            <button type="button" onClick={undoMarkAllRead} aria-label="Hoàn tác đánh dấu tất cả đã đọc" className="rounded-lg py-1.5 text-xs font-semibold text-primary hover:underline">Hoàn tác</button>
          )}
        </div>
        {!enabled && <p className="mt-3 rounded-xl bg-page px-3 py-2 text-xs leading-5 text-muted">Thông báo đang tắt. Bạn vẫn có thể xem các thông báo đã lưu.</p>}
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-4 pb-4 sm:px-5">
        {visible.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center px-5 py-8 text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary" aria-hidden>✓</span>
            <p className="text-sm font-semibold text-ink">{onlyUnread ? 'Bạn đã đọc hết thông báo' : 'Chưa có thông báo nào'}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{onlyUnread ? 'Chọn Tất cả để xem lại các thông báo trước.' : 'Các cập nhật mới sẽ xuất hiện tại đây.'}</p>
          </div>
        ) : visible.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => markRead(item.id)}
            aria-label={`${item.title}${item.read ? '' : ', chưa đọc'}`}
            className={cn('flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition', item.read ? 'border-line bg-white hover:bg-page' : 'border-primary/15 bg-primary-soft/50 hover:bg-primary-soft')}
          >
            <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', DOT_COLORS[item.type])} aria-hidden />
            <span className="min-w-0 flex-1">
              <span className={cn('block text-sm leading-5 text-ink', item.read ? 'font-medium' : 'font-semibold')}>{item.title}</span>
              <span className="mt-1 block break-words text-[13px] leading-5 text-muted">{item.body}</span>
              <span className="mt-2 block text-[11px] text-muted">{item.time}</span>
            </span>
            {!item.read && <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
          </button>
        ))}
      </div>
      <div className="shrink-0 border-t border-line px-5 py-3 text-center">
        <Link href="/notifications" onClick={close} className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary-soft">Xem tất cả thông báo <span aria-hidden>→</span></Link>
      </div>
    </div>,
    document.body,
  );
}
