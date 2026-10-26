'use client';

import { useMemo, useState, type FormEvent } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import {
  appendAudit,
  combinedAuditLog,
  nextId,
  nowStamp,
  useAdminNotifications,
  useAuditExtra,
  useBroadcasts,
  type Broadcast,
} from '@/lib/admin-store';
import { pushTenantNotification } from '@/lib/tenant-store';
import { pushLandlordNotification } from '@/lib/landlord-store';
import { cn } from '@/lib/utils';

type Audience = 'all' | 'landlords' | 'tenants';

const AUDIENCE_OPTIONS: { value: Audience; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'landlords', label: 'Chủ trọ' },
  { value: 'tenants', label: 'Khách thuê' },
];

// C6 · UC07.7 + UC07.9 — both halves are mock-level today:
// - Broadcast: Notification API has NO POST endpoint (read/mark-read only),
//   so composing records a local broadcast history in the admin store.
// - Audit log: AuditLog entity exists but has NO read endpoint; the log below
//   is seeded mock data + session actions appended by C3/C4/C5, with
//   search + actor/action filters.
export default function NotificationsPage() {
  const { push } = useToast();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<Audience>('all');
  const [titleError, setTitleError] = useState('');
  const [bodyError, setBodyError] = useState('');

  const [broadcasts, setBroadcasts] = useBroadcasts();
  const [notifications, setNotifications] = useAdminNotifications();
  const [auditExtra, setAuditExtra] = useAuditExtra();

  const [auditQuery, setAuditQuery] = useState('');
  const [actorFilter, setActorFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  const audit = useMemo(() => combinedAuditLog(auditExtra), [auditExtra]);
  const actors = useMemo(() => Array.from(new Set(audit.map((e) => e.actor))), [audit]);
  const actions = useMemo(() => Array.from(new Set(audit.map((e) => e.action))), [audit]);
  const filteredAudit = useMemo(() => {
    const q = auditQuery.trim().toLowerCase();
    return audit.filter((e) => {
      if (actorFilter !== 'all' && e.actor !== actorFilter) return false;
      if (actionFilter !== 'all' && e.action !== actionFilter) return false;
      if (q && !`${e.actor} ${e.action} ${e.target} ${e.time}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [audit, auditQuery, actorFilter, actionFilter]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    const b = body.trim();
    let ok = true;
    if (!t) {
      setTitleError('Vui lòng nhập tiêu đề thông báo.');
      ok = false;
    } else setTitleError('');
    if (!b) {
      setBodyError('Vui lòng nhập nội dung thông báo.');
      ok = false;
    } else setBodyError('');
    if (!ok) return;

    const label = AUDIENCE_OPTIONS.find((o) => o.value === audience)?.label ?? 'Tất cả';
    const item: Broadcast = {
      id: nextId(broadcasts),
      title: t,
      body: b,
      audience,
      audienceLabel: label,
      time: nowStamp(),
    };
    setBroadcasts((prev) => [item, ...prev]);
    // UC07.7 (mock): a broadcast now lands in the recipients' mock inboxes,
    // not just in this history list. The backend has no notification POST,
    // so delivery is browser-local until the team adds it.
    if (audience === 'all' || audience === 'tenants') pushTenantNotification({ type: 'SYSTEM', title: t, body: b });
    if (audience === 'all' || audience === 'landlords') pushLandlordNotification({ type: 'SYSTEM', title: t, body: b });
    appendAudit(setAuditExtra, 'Gửi thông báo', `${t} → ${label}`);
    setTitle('');
    setBody('');
    push('Đã gửi thông báo', `Gửi tới: ${label} · Hộp thư mô phỏng của nhóm đã chọn.`);
  };

  const markRead = (id: number) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const selectCls =
    'h-9 rounded-xl border border-line bg-white px-3 text-[13px] font-medium text-ink outline-none focus:border-primary';

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Thông báo &amp; Nhật ký</h1>
      <p className="mt-1 text-sm text-muted">Phát thông báo hệ thống (mô phỏng) · nhật ký hoạt động có tìm kiếm &amp; lọc</p>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        {/* LEFT — Compose + history + received */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-[17px] font-semibold text-ink">Tạo thông báo</h2>
            <p className="mt-1 text-[13px] font-medium text-amber-700">Bản mock · Thông báo được gửi vào hộp thư mô phỏng của nhóm đã chọn.</p>

            <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
              <div>
                <Input
                  name="notifTitle"
                  placeholder="Tiêu đề thông báo"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (titleError) setTitleError('');
                  }}
                  aria-invalid={!!titleError}
                  className="h-[46px]"
                />
                {titleError && <p role="alert" className="mt-1.5 text-[13px] font-medium text-red-600">{titleError}</p>}
              </div>
              <div>
                <textarea
                  value={body}
                  onChange={(e) => {
                    setBody(e.target.value);
                    if (bodyError) setBodyError('');
                  }}
                  placeholder="Nội dung…"
                  rows={5}
                  aria-invalid={!!bodyError}
                  className="w-full resize-none rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                {bodyError && <p role="alert" className="mt-1 text-[13px] font-medium text-red-600">{bodyError}</p>}
              </div>
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
            </form>

            {broadcasts.length > 0 && (
              <div className="mt-6 border-t border-line pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Đã gửi trong phiên này · {broadcasts.length}</p>
                <div className="mt-2 divide-y divide-line">
                  {broadcasts.map((b) => (
                    <div key={b.id} className="py-3">
                      <p className="text-sm font-semibold text-ink">{b.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-[13px] text-muted">{b.body}</p>
                      <p className="mt-0.5 text-[13px] text-muted">Tới: {b.audienceLabel} · {b.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[17px] font-semibold text-ink">Thông báo của Admin{unreadCount > 0 ? ` · ${unreadCount} chưa đọc` : ''}</h2>
              {unreadCount > 0 && (
                <button type="button" onClick={markAllRead} className="shrink-0 text-[13px] font-bold text-primary hover:underline">
                  Đánh dấu đã đọc tất cả
                </button>
              )}
            </div>
            <div className="mt-3 divide-y divide-line">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => markRead(n.id)}
                  className="flex w-full items-start gap-3 py-3.5 text-left"
                >
                  <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-gray-300' : 'bg-primary')} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className={cn('block truncate text-sm', n.read ? 'font-medium text-muted' : 'font-semibold text-ink')}>{n.title}</span>
                    <span className="mt-0.5 block text-[13px] text-muted">{n.body} · {n.time}</span>
                  </span>
                  {!n.read && <Badge tone="indigo">Mới</Badge>}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* RIGHT — Audit log with search + filters */}
        <Card className="p-6">
          <h2 className="text-[17px] font-semibold text-ink">Nhật ký hoạt động</h2>
          <p className="mt-1 text-[13px] text-muted">Hiển thị {filteredAudit.length} / {audit.length} mục</p>

          <div className="mt-4 space-y-2.5">
            <Input
              name="auditSearch"
              type="search"
              placeholder="Tìm theo người thực hiện, hành động, đối tượng…"
              value={auditQuery}
              onChange={(e) => setAuditQuery(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <select aria-label="Lọc theo người thực hiện" value={actorFilter} onChange={(e) => setActorFilter(e.target.value)} className={selectCls}>
                <option value="all">Mọi người thực hiện</option>
                {actors.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <select aria-label="Lọc theo loại hành động" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className={selectCls}>
                <option value="all">Mọi hành động</option>
                {actions.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-2 divide-y divide-line">
            {filteredAudit.map((entry) => (
              <div key={entry.id} className="py-3.5">
                <p className="text-sm text-ink">
                  <span className="font-semibold">{entry.actor}</span> {entry.action} · {entry.target}
                </p>
                <p className="mt-0.5 text-[13px] text-muted">{entry.time}{entry.ip ? ` · IP ${entry.ip}` : ''}</p>
              </div>
            ))}
            {filteredAudit.length === 0 && <p className="py-8 text-center text-sm text-muted">Không có mục nhật ký nào khớp bộ lọc.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
