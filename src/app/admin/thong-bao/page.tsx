'use client';

import { useState, type FormEvent } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { notificationsAdmin, auditLog } from '@/lib/data';
import type { NotificationItem, NotificationType } from '@/types';
import { cn } from '@/lib/utils';

const TYPE_DOT: Record<NotificationType, string> = {
  SYSTEM: 'bg-primary',
  INVOICE: 'bg-amber-500',
  POST_APPROVAL: 'bg-green-600',
  INTEREST_REQUEST: 'bg-sky-500',
  GENERAL: 'bg-gray-400',
};

const TYPE_LABEL: Record<NotificationType, string> = {
  SYSTEM: 'Hệ thống',
  INVOICE: 'Hóa đơn',
  POST_APPROVAL: 'Kiểm duyệt',
  INTEREST_REQUEST: 'Quan tâm',
  GENERAL: 'Chung',
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>(notificationsAdmin);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    const b = body.trim();
    if (!t || !b) return;
    const next: NotificationItem = {
      id: Date.now(),
      type: 'SYSTEM',
      title: t,
      body: b,
      time: 'Vừa xong',
      read: false,
    };
    setItems((prev) => [next, ...prev]);
    setTitle('');
    setBody('');
    setSent(true);
    window.setTimeout(() => setSent(false), 3000);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[26px] font-extrabold tracking-tight text-ink">Thông báo hệ thống &amp; Nhật ký</h1>
        <p className="mt-1 text-sm text-muted">Gửi thông báo tới người dùng và theo dõi hoạt động quản trị</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* LEFT — Notifications */}
        <Card className="p-6">
          <h2 className="text-base font-bold text-ink">Thông báo hệ thống</h2>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-2xl border border-line bg-page p-4">
            <Input
              name="notifTitle"
              placeholder="Tiêu đề thông báo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Nội dung thông báo..."
              rows={3}
              className="w-full resize-none rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <Button type="submit" className="w-full">
              Gửi thông báo
            </Button>
            {sent && (
              <p className="flex items-center gap-1.5 text-[13px] font-medium text-green-700">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                Đã gửi thông báo thành công.
              </p>
            )}
          </form>

          <ul className="mt-5 divide-y divide-line">
            {items.map((n) => (
              <li key={n.id} className="flex gap-3 py-3.5 first:pt-0 last:pb-0">
                <span className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', TYPE_DOT[n.type])} aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{n.title}</p>
                    <span className="rounded-full bg-page px-2 py-0.5 text-[11px] font-medium text-muted">{TYPE_LABEL[n.type]}</span>
                    {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-label="Chưa đọc" />}
                  </div>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{n.body}</p>
                  <p className="mt-0.5 text-xs text-muted">{n.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* RIGHT — Audit log */}
        <Card className="h-fit p-6">
          <h2 className="text-base font-bold text-ink">Nhật ký hoạt động</h2>
          <p className="mt-0.5 text-xs text-muted">Mọi hành động quản trị đều được ghi lại</p>

          <ul className="mt-4 divide-y divide-line">
            {auditLog.map((entry) => (
              <li key={entry.id} className="py-3.5 first:pt-0 last:pb-0">
                <p className="text-sm leading-relaxed text-ink">
                  <span className="font-bold">{entry.actor}</span>{' '}
                  <span>{entry.action}</span>
                </p>
                <p className="mt-0.5 truncate text-[13px] text-muted">{entry.target}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {entry.time}
                  {entry.ip ? ` · IP ${entry.ip}` : ''}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
