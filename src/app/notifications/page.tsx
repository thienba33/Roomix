'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import TenantShell from '@/components/layouts/TenantShell';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import type { NotificationItem, NotificationType } from '@/types';
import {
  NOTIFICATIONS_EVENT,
  getNotificationsEnabled,
  getTenantNotifications,
  setTenantNotifications,
} from '@/lib/tenant-store';

/** Dot colors per type — same mapping as the landlord notifications page. */
const dotColor: Record<NotificationType, string> = {
  INTEREST_REQUEST: 'bg-[#B45309]',
  POST_APPROVAL: 'bg-[#16A34A]',
  INVOICE: 'bg-[#DC2626]',
  SYSTEM: 'bg-[#4F46E5]',
  GENERAL: 'bg-[#6A6A6A]',
};

const FILTERS: { key: NotificationType | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'INTEREST_REQUEST', label: 'Yêu cầu' },
  { key: 'INVOICE', label: 'Hóa đơn' },
  { key: 'POST_APPROVAL', label: 'Bài đăng' },
  { key: 'SYSTEM', label: 'Hệ thống' },
  { key: 'GENERAL', label: 'Chung' },
];

export default function NotificationsPage() {
  const toast = useToast();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<NotificationType | 'ALL'>('ALL');
  const [notifOn, setNotifOn] = useState(true);

  useEffect(() => {
    const sync = () => {
      setItems(getTenantNotifications());
      setNotifOn(getNotificationsEnabled());
    };
    sync();
    window.addEventListener(NOTIFICATIONS_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(NOTIFICATIONS_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const unread = items.filter((n) => !n.read).length;
  const visible = useMemo(
    () => (filter === 'ALL' ? items : items.filter((n) => n.type === filter)),
    [items, filter],
  );
  const countFor = (key: NotificationType | 'ALL') =>
    key === 'ALL' ? items.length : items.filter((n) => n.type === key).length;

  const markRead = (id: number) => {
    if (!items.find((n) => n.id === id && !n.read)) return;
    setTenantNotifications(items.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = () => {
    const before = items;
    setTenantNotifications(items.map((n) => ({ ...n, read: true })));
    toast.push('Đã đánh dấu tất cả đã đọc', `${before.filter((n) => !n.read).length} thông báo đã được đánh dấu.`, {
      label: 'Hoàn tác',
      onClick: () => setTenantNotifications(before),
    });
  };

  return (
    <TenantShell>
      <div className="w-full px-6 py-6 lg:px-12">
        <div className="mx-auto max-w-[860px]">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-[28px] font-extrabold text-ink">Thông báo</h1>
              <p className="mt-1 text-sm text-muted" aria-live="polite">
                {unread > 0 ? `${unread} thông báo chưa đọc` : 'Bạn đã đọc hết thông báo'}
              </p>
            </div>
            {unread > 0 && (
              <Button variant="outline" size="sm" onClick={markAllRead}>
                Đánh dấu tất cả đã đọc
              </Button>
            )}
          </div>

          {!notifOn && (
            <p className="mt-4 rounded-xl border border-line bg-page px-4 py-3 text-sm text-muted">
              Bạn đang tắt thông báo — danh sách vẫn lưu tại đây nhưng sẽ không có thông báo mới.{' '}
              <Link href="/profile" className="font-semibold text-primary hover:underline">
                Bật lại trong Hồ sơ
              </Link>
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition',
                  filter === f.key
                    ? 'border-primary bg-primary-soft text-primary'
                    : 'border-line bg-white text-muted hover:text-ink',
                )}
              >
                {f.label} · {countFor(f.key)}
              </button>
            ))}
          </div>

          <p className="mt-4 text-[13px] text-muted" aria-live="polite">
            Hiển thị {visible.length} / {items.length} thông báo
          </p>

          {visible.length === 0 ? (
            <div className="mt-2 flex flex-col items-center justify-center rounded-2xl border border-line bg-white py-16 text-center">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#DDDDDD" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
              <p className="mt-5 text-[17px] font-semibold text-ink">Không có thông báo nào</p>
              <p className="mt-2 text-sm text-muted">Bộ lọc hiện tại không khớp thông báo nào.</p>
              <Button variant="outline" className="mt-6" onClick={() => setFilter('ALL')}>
                Xóa bộ lọc
              </Button>
            </div>
          ) : (
            <Card className="mt-2 divide-y divide-line/70 overflow-hidden p-0">
              {visible.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => markRead(n.id)}
                  className={cn(
                    'flex w-full gap-3.5 px-5 py-4 text-left transition hover:bg-page/60',
                    !n.read && 'bg-primary-soft/40',
                  )}
                >
                  <span className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', dotColor[n.type])} />
                  <span className="min-w-0 flex-1">
                    <span className={cn('block text-[15px]', n.read ? 'font-medium text-ink' : 'font-bold text-ink')}>
                      {n.title}
                    </span>
                    <span className="mt-0.5 block text-sm text-muted">
                      {n.body} · {n.time}
                    </span>
                  </span>
                  {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Chưa đọc" />}
                </button>
              ))}
            </Card>
          )}
        </div>
      </div>
    </TenantShell>
  );
}
