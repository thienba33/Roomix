'use client';
import { useState, type FormEvent } from 'react';
import { useNotificationsState } from '@/lib/landlord-store';
import { useAuth } from '@/components/auth/AuthProvider';
import { useCatalog } from '@/hooks/useCatalog';
import { markAllModerationNoticesRead, markModerationNoticeRead } from '@/services/mock/rooms';
import type { NotificationItem, NotificationType } from '@/types';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const dotColor: Record<NotificationType, string> = { INTEREST_REQUEST: 'bg-[#B45309]', POST_APPROVAL: 'bg-[#16A34A]', INVOICE: 'bg-[#DC2626]', SYSTEM: 'bg-[#4F46E5]', GENERAL: 'bg-[#6A6A6A]' };
type Filter = NotificationType | 'ALL' | 'UNREAD';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' }, { key: 'UNREAD', label: 'Chưa đọc' }, { key: 'INTEREST_REQUEST', label: 'Yêu cầu' },
  { key: 'INVOICE', label: 'Hóa đơn' }, { key: 'POST_APPROVAL', label: 'Bài đăng' }, { key: 'SYSTEM', label: 'Hệ thống' }, { key: 'GENERAL', label: 'Khác' },
];

export default function ThongBaoPage() {
  const toast = useToast();
  const { user } = useAuth();
  const catalog = useCatalog();
  const [items, setItems] = useNotificationsState();
  const [text, setText] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');
  const moderationNotices = catalog.items.filter((room) => room.landlordId === user?.id)
    .flatMap((room) => (room.moderationNotices ?? []).map((notice) => ({ room, notice })))
    .sort((a, b) => b.notice.createdAt.localeCompare(a.notice.createdAt));
  const visibleModeration = (filter === 'ALL' || filter === 'UNREAD' || filter === 'POST_APPROVAL') ? moderationNotices.filter(({ notice }) => filter !== 'UNREAD' || !notice.read) : [];
  const unread = items.filter((n) => !n.read).length + moderationNotices.filter(({ notice }) => !notice.read).length;
  const filtered = items.filter((n) => filter === 'ALL' ? true : filter === 'UNREAD' ? !n.read : n.type === filter);

  const markRead = (id: number) => setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAll = () => { try { markAllModerationNoticesRead(); setItems((p) => p.map((n) => ({ ...n, read: true }))); toast.push('Đã đánh dấu tất cả đã đọc'); } catch (error) { toast.push(error instanceof Error ? error.message : 'Không thể cập nhật thông báo.'); } };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault(); const trimmed = text.trim(); if (!trimmed) return;
    const newItem: NotificationItem = { id: Math.max(0, ...items.map((n) => n.id)) + 1, type: 'SYSTEM', title: 'Thông báo từ chủ trọ', body: trimmed, time: 'Vừa xong', read: false };
    setItems((prev) => [newItem, ...prev]); setText('');
    toast.push('Đã thêm thông báo (cục bộ)', 'Thông báo được lưu trong trình duyệt ở chế độ minh họa.');
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-2xl font-semibold text-ink">Thông báo</h1><p className="mt-1 text-[13px] text-muted">{unread} chưa đọc · Mới nhất trước</p></div>
        {unread > 0 && <Button variant="outline" size="sm" onClick={markAll}>Đánh dấu tất cả đã đọc</Button>}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">{FILTERS.map((f) => (<button key={f.key} onClick={() => setFilter(f.key)} className={cn('rounded-full px-3.5 py-1.5 text-[13px] transition', filter === f.key ? 'bg-primary-soft font-semibold text-primary' : 'bg-page font-medium text-muted hover:text-ink')}>{f.label}{f.key === 'UNREAD' && unread > 0 ? ` (${unread})` : ''}</button>))}</div>
      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[1fr_356px]">
        <div className="rounded-2xl border border-line bg-white">
          {filtered.length === 0 && visibleModeration.length === 0 ? <p className="px-5 py-10 text-sm text-muted">Không có thông báo nào ở mục này.</p> : (
            <div className="divide-y divide-line">
              {visibleModeration.map(({ room, notice }) => <button key={notice.id} type="button" onClick={() => { try { markModerationNoticeRead(room.detail.postId, notice.id); } catch (error) { toast.push(error instanceof Error ? error.message : 'Không thể đánh dấu đã đọc.'); } }} className={cn('flex w-full gap-[26px] px-5 py-6 text-left hover:bg-page/50', !notice.read && 'bg-primary-soft/30')}>
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-green-600" />
                <span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold text-ink">{notice.action === 'approve' ? 'Bài đăng đã được duyệt' : notice.action === 'remove' ? 'Bài đăng đã bị Admin gỡ' : notice.action === 'restore' ? 'Bài đăng đã được khôi phục' : 'Bài đăng chưa được duyệt'}</span><span className="mt-1 block break-words text-[13px] text-muted">{room.detail.title}{notice.action === 'reject' || notice.action === 'remove' ? ` · Lý do: ${notice.reason ?? ''}` : notice.action === 'restore' ? ' · Tin đã hiển thị trở lại trên trang tìm phòng.' : ' · Tin đã xuất hiện trên trang tìm phòng.'}</span></span>
                {!notice.read && <span className="shrink-0 text-xs font-medium text-primary">Mới</span>}
              </button>)}
              {filtered.map((n) => (
              <button key={n.id} type="button" onClick={() => markRead(n.id)} className={cn('flex w-full gap-[26px] px-5 py-6 text-left transition hover:bg-page/50', !n.read && 'bg-primary-soft/30')}>
                <span className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', dotColor[n.type])} />
                <div className="min-w-0 flex-1"><p className={cn('text-[15px] text-ink', !n.read ? 'font-bold' : 'font-semibold')}>{n.title}{!n.read && <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-white">Mới</span>}</p><p className="mt-1 text-[13px] text-muted">{n.body} · {n.time}</p></div>
                {!n.read && <span className="shrink-0 text-[12px] font-medium text-primary">Nhấn để đánh dấu đã đọc</span>}
              </button> ))}</div>
          )}
        </div>
        <div className="min-h-[300px] rounded-2xl border border-line bg-white p-5">
          <h2 className="text-[15px] font-semibold text-ink">Gửi cho khách thuê</h2>
          <form onSubmit={handleSubmit}>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Nội dung thông báo…" className="mt-4 h-[46px] w-full rounded-xl border border-line bg-white px-4 text-sm text-ink placeholder:text-muted outline-none transition focus:border-ink focus:ring-1 focus:ring-ink/15" />
            <p className="mt-3 text-[13px] text-muted">Gửi tới: tất cả khách đang thuê</p>
            <Button type="submit" variant="primary" className="mt-3 w-full">Gửi thông báo</Button>
            <p className="mt-3 text-[12px] text-muted">Chế độ minh họa · Thông báo được lưu trong trình duyệt.</p>
          </form>
        </div>
      </div>
    </div>
  );
}
