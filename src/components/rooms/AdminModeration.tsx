'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useCatalog } from '@/hooks/useCatalog';
import { formatVND, roomStatusLabel } from '@/lib/utils';
import { moderatePost, type CatalogRoom } from '@/services/mock/rooms';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { ListingPhoto, ListingStatus } from './ListingVisuals';

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

export default function AdminModeration({ postId }: { postId?: string }) {
  const { user, ready: authReady } = useAuth();
  const catalog = useCatalog();
  if (!authReady || !catalog.ready) return <div role="status" className="space-y-5"><h1 className="text-[28px] font-extrabold">Kiểm duyệt tin đăng</h1><p className="text-muted">Đang tải hàng chờ…</p><div className="h-48 animate-pulse rounded-2xl bg-page" aria-hidden="true" /></div>;
  if (user?.role !== 'ADMIN') return <div role="alert" className="rounded-2xl border border-line p-6"><h1 className="text-xl font-bold">Chỉ quản trị viên được kiểm duyệt tin</h1><Link href="/admin/login" className="mt-3 inline-block font-semibold text-primary">Đăng nhập quản trị</Link></div>;
  if (catalog.error) return <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6"><h1 className="text-lg font-bold">Chưa thể tải hàng chờ</h1><p className="mt-2 text-sm">{catalog.error}</p><Button variant="outline" className="mt-4" onClick={catalog.retry}>Thử lại</Button></div>;

  const pending = catalog.items.filter((item) => item.postStatus === 'PENDING').sort((a, b) => b.detail.createdAt.localeCompare(a.detail.createdAt));
  if (postId) return <ModerationDetail key={postId} postId={postId} item={catalog.items.find((item) => item.detail.postId === postId)} pendingCount={pending.length} />;
  return <ModerationQueue pending={pending} />;
}

function ModerationQueue({ pending }: { pending: CatalogRoom[] }) {
  return <div className="space-y-7 pb-6">
    <header className="border-b border-line pb-6">
      <h1 className="text-[28px] font-extrabold tracking-tight text-ink sm:text-[32px]">Kiểm duyệt tin đăng</h1>
      <p className="mt-2 text-sm leading-6 text-muted">Kiểm tra nội dung trước khi phòng xuất hiện trong kết quả tìm kiếm.</p>
    </header>
    <section aria-label="Tin chờ kiểm duyệt" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-bold">Chờ kiểm tra</h2><span role="status" className="rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-800">{pending.length} tin</span></div>
      {pending.length ? <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
        {pending.map((item) => <article key={item.detail.postId} className="grid gap-4 p-4 sm:grid-cols-[112px_minmax(0,1fr)_auto] sm:items-center sm:p-5">
          <ListingPhoto src={item.detail.primaryImageUrl} alt={`Ảnh ${item.detail.title}`} className="h-28 rounded-xl sm:h-24" />
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2"><ListingStatus status="PENDING" /><span className="text-xs text-muted">Gửi {dateLabel(item.detail.createdAt)}</span></div>
            <h3 className="truncate text-base font-bold text-ink">{item.detail.title}</h3>
            <p className="truncate text-sm text-muted">{item.detail.houseName} · {item.detail.floorName} · Phòng {item.detail.roomNumber}</p>
            <p className="text-sm font-semibold text-ink">{formatVND(item.detail.rentalPrice)}/tháng <span className="font-normal text-muted">· {item.detail.area} m²</span></p>
          </div>
          <Link href={`/admin/moderation/${item.detail.postId}`} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Kiểm tra tin</Link>
        </article>)}
      </div> : <div className="rounded-2xl border border-line bg-white px-6 py-14 text-center"><h3 className="text-lg font-bold">Không có tin chờ duyệt</h3><p className="mt-2 text-sm text-muted">Tin mới do chủ trọ gửi sẽ xuất hiện tại đây.</p></div>}
    </section>
  </div>;
}

function ModerationDetail({ postId, item, pendingCount }: { postId: string; item?: CatalogRoom; pendingCount: number }) {
  const [dialog, setDialog] = useState<'approve' | 'reject' | null>(null);
  const [reason, setReason] = useState('');
  const [failure, setFailure] = useState('');
  const [outcome, setOutcome] = useState<'approve' | 'reject' | null>(null);
  const confirming = useRef(false);
  const pending = item?.postStatus === 'PENDING';
  const open = (action: 'approve' | 'reject') => { setDialog(action); setFailure(''); setReason(''); confirming.current = false; };
  const confirm = () => {
    if (!dialog || confirming.current) return;
    if (dialog === 'reject' && !reason.trim()) { setFailure('Vui lòng nhập lý do từ chối.'); return; }
    confirming.current = true;
    try {
      moderatePost(postId, dialog, reason);
      setOutcome(dialog);
      setDialog(null);
    } catch (cause) {
      setFailure(cause instanceof Error ? cause.message : 'Không thể kiểm duyệt tin. Vui lòng thử lại.');
      confirming.current = false;
    }
  };
  return <div className="space-y-6 pb-8">
    <Link href="/admin/moderation" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">← Hàng chờ kiểm duyệt ({pendingCount})</Link>
    {outcome ? <div role="status" className="rounded-2xl border border-green-200 bg-green-50 p-6"><h1 className="text-xl font-bold text-green-900">{outcome === 'approve' ? 'Tin đã được duyệt' : 'Đã từ chối tin đăng'}</h1><p className="mt-2 text-sm text-green-900">{outcome === 'approve' ? 'Tin đủ điều kiện sẽ xuất hiện trong tìm kiếm công khai. Chủ trọ có thể xem kết quả trong Tin đăng và Thông báo.' : 'Lý do từ chối đã được lưu để chủ trọ xem và chỉnh sửa tin.'}</p>{outcome === 'approve' && item && <Link href={`/rooms/${item.detail.roomId}`} className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">Xem phòng công khai</Link>}</div> : null}
    {!item ? <div role="alert" className="rounded-2xl border border-line p-8"><h1 className="text-xl font-bold">Không tìm thấy tin đăng</h1><p className="mt-2 text-sm text-muted">Tin có thể đã bị xóa khỏi dữ liệu mô phỏng.</p></div>
      : !pending && !outcome ? <div role="status" className="rounded-2xl border border-line p-8"><h1 className="text-xl font-bold">Tin không còn chờ kiểm duyệt</h1><p className="mt-2 text-sm text-muted">Trạng thái hiện tại: {item.postStatus}. Quay lại hàng chờ để chọn tin khác.</p></div>
        : <>
          <header className="border-b border-line pb-5"><div className="flex flex-wrap items-center gap-3"><h1 className="text-[27px] font-extrabold tracking-tight text-ink sm:text-[32px]">{item.detail.title}</h1><ListingStatus status={item.postStatus} /></div><p className="mt-2 text-sm text-muted">{item.detail.houseName} · {item.detail.floorName} · Phòng {item.detail.roomNumber}</p></header>
          <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_290px]">
            <div className="space-y-6">
              <section aria-label="Hình ảnh phòng" className="grid gap-2 sm:grid-cols-2">{item.detail.imageUrls.length ? item.detail.imageUrls.map((src, index) => <ListingPhoto key={`${src}-${index}`} src={src} alt={`Ảnh phòng ${index + 1}`} className={`rounded-xl ${index === 0 ? 'h-64 sm:col-span-2' : 'h-40'}`} />) : <ListingPhoto alt="Chưa có ảnh phòng" className="h-56 rounded-xl sm:col-span-2" />}</section>
              <section className="rounded-2xl border border-line bg-white p-5 sm:p-6"><h2 className="text-lg font-bold">Nội dung tin</h2><p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-secondary">{item.detail.description}</p>{item.detail.amenitiesDescription && <p className="mt-4 border-t border-line pt-4 text-sm text-muted">Tiện ích: {item.detail.amenitiesDescription}</p>}</section>
            </div>
            <aside className="space-y-5 rounded-2xl border border-line bg-white p-5 lg:sticky lg:top-6">
              <div><h2 className="text-base font-bold">Thông tin xét duyệt</h2><p className="mt-2 text-xs text-muted">Mã tin: {item.detail.postId}</p></div>
              <dl className="space-y-3 border-y border-line py-4 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-muted">Giá thuê</dt><dd className="text-right font-semibold">{formatVND(item.detail.rentalPrice)}/tháng</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted">Đặt cọc</dt><dd className="text-right font-semibold">{formatVND(item.detail.depositAmount)}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted">Diện tích</dt><dd className="font-semibold">{item.detail.area} m²</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted">Phòng</dt><dd className="font-semibold">{roomStatusLabel[item.roomStatus]}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted">Có thể thuê</dt><dd className="font-semibold">{dateLabel(item.detail.availableFrom)}</dd></div>
              </dl>
              <p className="text-xs leading-5 text-muted">Chỉ tin chờ duyệt mới có thể xử lý. Duyệt tin không thay đổi tình trạng thuê của phòng.</p>
              {pending && <div className="grid gap-2"><Button className="w-full" onClick={() => open('approve')}>Duyệt tin</Button><Button className="w-full" variant="outline" onClick={() => open('reject')}>Từ chối và ghi lý do</Button></div>}
            </aside>
          </div>
        </>}
    <Modal open={!!dialog} onClose={() => setDialog(null)} title={dialog === 'approve' ? 'Duyệt tin đăng?' : 'Từ chối tin đăng?'}>
      <p className="text-sm leading-6 text-muted">{dialog === 'approve' ? 'Tin đủ điều kiện sẽ xuất hiện trong tìm kiếm công khai và chủ trọ nhận thông báo kết quả.' : 'Chủ trọ sẽ thấy lý do để sửa tin và gửi duyệt lại.'}</p>
      {dialog === 'reject' && <div className="mt-5"><label htmlFor="moderation-reason" className="block text-sm font-semibold">Lý do từ chối <span className="text-red-600">*</span></label><textarea id="moderation-reason" value={reason} onChange={(event) => { setReason(event.target.value); setFailure(''); }} maxLength={1000} rows={4} aria-invalid={!!failure} aria-describedby={failure ? 'moderation-error' : undefined} className="mt-2 w-full rounded-xl border border-line p-3 text-sm focus:border-primary focus:outline-2 focus:outline-primary/20" placeholder="Nêu rõ phần cần điều chỉnh…" /><p className="mt-1 text-right text-xs text-muted">{reason.length}/1000 ký tự</p></div>}
      {failure && <p id="moderation-error" role="alert" className="mt-3 text-sm text-red-700">{failure}</p>}
      <div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setDialog(null)}>Hủy</Button><Button variant={dialog === 'reject' ? 'danger' : 'primary'} onClick={confirm}>{dialog === 'approve' ? 'Duyệt tin' : 'Từ chối tin'}</Button></div>
    </Modal>
  </div>;
}
