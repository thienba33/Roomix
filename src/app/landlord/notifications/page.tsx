'use client';

import { useState, type FormEvent } from 'react';
import { notificationsLandlord } from '@/lib/data';
import type { NotificationItem, NotificationType } from '@/types';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

const dotColor: Record<NotificationType, string> = {
  INTEREST_REQUEST: 'bg-[#B45309]',
  POST_APPROVAL: 'bg-[#16A34A]',
  INVOICE: 'bg-[#DC2626]',
  SYSTEM: 'bg-[#4F46E5]',
  GENERAL: 'bg-[#6A6A6A]',
};

export default function ThongBaoPage() {
  const [items, setItems] = useState<NotificationItem[]>(notificationsLandlord);
  const [text, setText] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    const newItem: NotificationItem = {
      id: Math.max(0, ...items.map((n) => n.id)) + 1,
      type: 'SYSTEM',
      title: 'Thông báo từ chủ trọ',
      body: trimmed,
      time: 'Vừa xong',
      read: false,
    };
    setItems((prev) => [newItem, ...prev]);
    setText('');
  };

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold text-ink">Thông báo</h1>
        <p className="mt-1 text-[13px] text-muted">Mới nhất trước</p>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_356px] items-start">
        <div className="rounded-2xl border border-line bg-white">
          <div className="divide-y divide-line">
            {items.map((n) => (
              <div key={n.id} className="flex gap-[26px] px-5 py-8">
                <span className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', dotColor[n.type])} />
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-ink">{n.title}</p>
                  <p className="mt-1 text-[13px] text-muted">
                    {n.body} · {n.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="min-h-[300px] rounded-2xl border border-line bg-white p-5">
          <h2 className="text-[15px] font-semibold text-ink">Gửi cho khách thuê</h2>
          <form onSubmit={handleSubmit}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Nội dung thông báo…"
              className="mt-4 h-[46px] w-full rounded-xl border border-line bg-white px-4 text-sm text-ink placeholder:text-muted outline-none transition focus:border-ink focus:ring-1 focus:ring-ink/15"
            />
            <p className="mt-3 text-[13px] text-muted">Gửi tới: tất cả khách đang thuê</p>
            <Button type="submit" variant="primary" className="mt-3 w-full">
              Gửi thông báo
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
