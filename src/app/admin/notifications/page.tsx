'use client';

import { useState, type FormEvent } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { auditLog } from '@/lib/data';
import { cn } from '@/lib/utils';

type Audience = 'all' | 'landlords' | 'tenants';

const AUDIENCE_OPTIONS: { value: Audience; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'landlords', label: 'Chủ trọ' },
  { value: 'tenants', label: 'Khách thuê' },
];

function timePartOf(time: string): string {
  const idx = time.indexOf(' ');
  return idx >= 0 ? time.slice(idx + 1) : time;
}

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<Audience>('all');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    const b = body.trim();
    if (!t || !b) return;
    setTitle('');
    setBody('');
    setSent(true);
    window.setTimeout(() => setSent(false), 3000);
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Thông báo &amp; Nhật ký</h1>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        {/* LEFT — Compose */}
        <Card className="p-6">
          <h2 className="text-[17px] font-semibold text-ink">Tạo thông báo</h2>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <Input
              name="notifTitle"
              placeholder="Tiêu đề thông báo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-[46px]"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Nội dung…"
              rows={5}
              className="w-full resize-none rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <div>
              <p className="text-[13px] font-medium text-ink">Gửi tới</p>
              <div className="mt-2 flex gap-2">
                {AUDIENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAudience(opt.value)}
                    className={cn(
                      'h-7 rounded-full px-3 text-xs font-medium',
                      audience === opt.value ? 'bg-primary-soft text-primary' : 'bg-[#F7F7F7] text-muted',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
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
        </Card>

        {/* RIGHT — Audit log */}
        <Card className="p-6">
          <h2 className="text-[17px] font-semibold text-ink">Nhật ký hoạt động</h2>

          <div className="mt-4 divide-y divide-line">
            {auditLog.map((entry) => (
              <div key={entry.id} className="grid grid-cols-[90px_1fr] gap-3 py-3.5">
                <span className="text-[13px] text-muted">{timePartOf(entry.time)}</span>
                <p className="truncate text-sm text-ink">
                  {entry.actor} {entry.action} · {entry.target}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
