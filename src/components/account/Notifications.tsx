'use client';
import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNotifications } from '@/hooks/useNotifications';
import { markAllRead, markRead } from '@/services/backend/notifications';
import Button from '@/components/ui/Button';
export default function Notifications() {
  const { user, ready: authReady, openAuth } = useAuth();
  const { items, unread, ready, error, retry } = useNotifications();
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);
  const act = async (id?: string) => {
    if (busy) return;
    setBusy(true); setFailure('');
    try { if (id) await markRead(id); else await markAllRead(); }
    catch (cause) { setFailure(cause instanceof Error ? cause.message : 'Không thể cập nhật thông báo.'); }
    finally { setBusy(false); }
  };
  if (!authReady || !ready) return <p role="status" className="py-6 text-muted">Đang tải thông báo…</p>;
  if (!user) return <div className="space-y-3 py-6"><p>Đăng nhập để xem thông báo của bạn.</p><Button onClick={() => openAuth()}>Đăng nhập</Button></div>;
  const visible = onlyUnread ? items.filter((item) => !item.read) : items;
  return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">Thông báo</h1><Button size="sm" variant="outline" disabled={!unread || busy} onClick={() => void act()}>Đọc tất cả</Button></div>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyUnread} onChange={(event) => setOnlyUnread(event.target.checked)} />Chưa đọc ({unread})</label>
    {(error || failure) && <div role="alert" className="space-y-3 text-sm text-red-700"><p>{error || failure}</p><Button size="sm" variant="outline" onClick={retry}>Thử lại</Button></div>}
    {!error && !visible.length && <p className="py-8 text-sm text-muted">{onlyUnread ? 'Bạn đã đọc hết thông báo.' : 'Chưa có thông báo.'}</p>}
    <div className="space-y-3">{visible.map((item) => <button key={item.id} disabled={busy} onClick={() => { if (!item.read) void act(item.id); }} className={`block w-full rounded-xl border p-4 text-left focus-visible:outline-2 focus-visible:outline-primary ${item.read ? 'border-line bg-white' : 'border-primary/20 bg-primary-soft/40'}`}><span className="block text-sm font-semibold">{item.title}</span><span className="mt-1 block whitespace-pre-line text-sm text-muted">{item.content}</span><time className="mt-2 block text-xs text-muted">{new Date(item.createdAt).toLocaleString('vi-VN')}</time></button>)}</div>
  </section>;
}
