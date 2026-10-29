'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useAdminPosts } from '@/hooks/useAdminPosts';
import { moderatePost } from '@/services/backend/rooms';
import { formatVND, postStatusLabel } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
export default function AdminModeration({ postId }: { postId?: string }) {
  const { items, ready, error, retry } = useAdminPosts();
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  if (!ready) return <p role="status">Đang tải tin đăng…</p>;
  if (error) return <div role="alert" className="space-y-3"><p>{error}</p><Button onClick={retry}>Thử lại</Button></div>;
  const selected = items.find((item) => item.id === postId);
  if (postId && !selected) return <p role="alert">Không tìm thấy tin đăng. <Link href="/admin/moderation">Về hàng chờ</Link></p>;
  const pending = items.filter((item) => item.status === 'PENDING');
  return <section className="admin-moderation space-y-5">
    <h1 className="text-2xl font-bold">Kiểm duyệt tin đăng</h1>
    {selected ? <>
      <Link className="inline-block text-sm font-semibold text-primary" href="/admin/moderation">← Hàng chờ</Link>
      <article className="admin-review">
        <div className="admin-review-content">
          <h2 className="text-xl font-semibold">{selected.title}</h2>
          <p className="mt-3 text-sm text-muted">{postStatusLabel[selected.status]}</p>
          <p className="mt-6 whitespace-pre-line text-sm leading-7">{selected.description}</p>
          <p className="mt-6 text-xs leading-5 text-muted">Chưa có ảnh và thông tin chi tiết phòng trong dữ liệu kiểm duyệt.</p>
          {selected.rejectReason && <p className="mt-4 text-sm text-red-700">Lý do từ chối: {selected.rejectReason}</p>}
        </div>
        <div className="admin-review-decision">
          <dl className="grid gap-5 text-sm sm:grid-cols-2">
            {[['Tiền thuê / tháng', formatVND(selected.rentalPrice)], ['Tiền cọc', formatVND(selected.depositAmount)], ['Ngày có thể thuê', selected.availableFrom], ['Mã phòng', selected.roomId]].map(([label, value]) => <div key={label}><dt className="text-muted">{label}</dt><dd className="mt-1 break-all font-semibold">{value}</dd></div>)}
          </dl>
          {selected.status === 'PENDING' && <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-5">
            <Button onClick={() => { setFailure(''); setAction('approve'); }}>Duyệt tin</Button>
            <Button variant="outline" onClick={() => { setFailure(''); setAction('reject'); }}>Từ chối</Button>
          </div>}
        </div>
      </article>
    </> : <>
      <p role="status" className="border-b border-line pb-4 text-sm text-muted">{pending.length} tin chờ duyệt</p>
      <div className="admin-review-queue divide-y divide-line">
        {pending.length ? pending.map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
          <div className="min-w-0 flex-1"><h2 className="break-words font-semibold">{item.title}</h2><p className="mt-2 text-sm text-muted">{formatVND(item.rentalPrice)} / tháng</p></div>
          <Link className="shrink-0 rounded-sm border border-line px-4 py-2 text-sm font-semibold text-primary hover:border-primary" href={`/admin/moderation/${item.id}`}>Kiểm tra tin</Link>
        </article>) : <p className="py-10 text-sm text-muted">Không có tin chờ duyệt.</p>}
      </div>
    </>}
    <Modal contentClassName="admin-dialog" open={!!action} onClose={() => { if (!busy) setAction(null); }} title={action === 'approve' ? 'Duyệt tin đăng' : 'Từ chối tin đăng'}><form className="space-y-4" onSubmit={async (event) => {
    event.preventDefault(); if (!selected || !action || lock.current) return;
    const data = new FormData(event.currentTarget);
    lock.current = true; setBusy(true); setFailure('');
    try { await moderatePost(selected.id, action, String(data.get('reason') ?? '')); setAction(null); }
    catch (cause) { setFailure(cause instanceof Error ? cause.message : 'Không thể kiểm duyệt.'); }
    finally { lock.current = false; setBusy(false); }
  }}><p className="text-sm">{selected?.title}</p>{action === 'reject' && <label className="block text-sm">Lý do<textarea name="reason" required maxLength={1000} className="mt-2 w-full rounded-xl border border-line p-3" /></label>}{failure && <p role="alert" className="text-sm text-red-700">{failure}</p>}<Button type="submit" disabled={busy}>{busy ? 'Đang xử lý…' : 'Xác nhận'}</Button></form></Modal></section>;
}
