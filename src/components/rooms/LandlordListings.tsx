'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { useCatalog } from '@/hooks/useCatalog';
import { cn, formatVND, postStatusLabel, roomStatusLabel } from '@/lib/utils';
import { getSubmissionRequirements } from '@/lib/listing-validation';
import { changePostStatus, deleteListing, type CatalogRoom } from '@/services/mock/rooms';
import type { PostStatus } from '@/types';
import { ListingPhoto, ListingStatus, SubmissionChecklist } from './ListingVisuals';

type Action = 'submit' | 'hide' | 'unhide' | 'delete';
const statuses: PostStatus[] = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'HIDDEN'];
const actions = {
  submit: { title: 'Gửi tin để xét duyệt', button: 'Gửi duyệt', success: 'Đã gửi tin để xét duyệt.', description: 'Tin sẽ chuyển sang chờ duyệt. Bạn có thể theo dõi kết quả ngay tại đây.' },
  hide: { title: 'Ẩn tin đăng này?', button: 'Ẩn tin', success: 'Đã ẩn tin khỏi trang tìm phòng.', description: 'Tin sẽ tạm ngừng hiển thị trên trang tìm phòng. Việc này không thay đổi tình trạng thuê của phòng.' },
  unhide: { title: 'Hiện lại tin đăng?', button: 'Hiện lại', success: 'Tin đã hiển thị trở lại.', description: 'Tin đã được duyệt sẽ xuất hiện trở lại trên trang tìm phòng.' },
  delete: { title: 'Xóa tin đăng và phòng này?', button: 'Xóa tin', success: 'Đã xóa tin đăng và phòng khỏi dữ liệu mô phỏng.', description: 'Phòng và tin đăng sẽ biến mất khỏi danh sách. Không xóa được phòng đang có yêu cầu chờ xử lý hoặc hợp đồng chờ cọc/đang thuê.' },
};
const hints: Record<PostStatus, string> = {
  DRAFT: 'Hoàn thiện nội dung rồi gửi xét duyệt.',
  PENDING: 'Đang chờ quản trị viên xét duyệt.',
  APPROVED: 'Tin đang hiển thị trên trang tìm phòng.',
  REJECTED: 'Kiểm tra lý do từ chối trước khi gửi lại.',
  HIDDEN: 'Tin đã được duyệt và đang tạm ẩn.',
};
const createClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark';

export default function LandlordListings() {
  const { user, ready: authReady } = useAuth();
  const catalog = useCatalog();
  if (!authReady || !catalog.ready) return <div className="space-y-5" role="status"><h1 className="text-[28px] font-extrabold">Tin đăng của tôi</h1><p className="text-muted">Đang tải tin đăng…</p><div aria-hidden="true" className="h-56 animate-pulse rounded-2xl bg-page" /></div>;
  if (user?.role !== 'LANDLORD') return <p role="alert">Bạn cần đăng nhập bằng tài khoản chủ trọ để quản lý tin đăng.</p>;
  return <Listings key={user.id} items={catalog.items.filter((room) => room.landlordId === user.id)} error={catalog.error} retry={catalog.retry} />;
}

function Listings({ items, error, retry }: { items: CatalogRoom[]; error: string; retry: () => void }) {
  const [filter, setFilter] = useState<PostStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [target, setTarget] = useState<{ roomId: string; action: Action } | null>(null);
  const [failure, setFailure] = useState('');
  const [notice, setNotice] = useState('');
  const confirming = useRef(false);
  const query = search.trim().toLocaleLowerCase('vi-VN');
  const visible = items.filter((room) => (filter === 'ALL' || room.postStatus === filter)
    && `${room.detail.title} ${room.detail.roomNumber}`.toLocaleLowerCase('vi-VN').includes(query));
  const selected = items.find((room) => room.detail.roomId === target?.roomId);
  const requirements = selected ? getSubmissionRequirements(selected.detail.area, selected.detail.rentalPrice, selected.detail.imageUrls.length) : [];
  const open = (roomId: string, action: Action) => {
    setFailure(''); setNotice(''); confirming.current = false; setTarget({ roomId, action });
  };
  const confirm = () => {
    if (!target || confirming.current) return;
    confirming.current = true;
    try {
      if (target.action === 'delete') deleteListing(target.roomId);
      else changePostStatus(target.roomId, target.action);
      setNotice(actions[target.action].success);
      setTarget(null);
    } catch (cause) {
      setFailure(cause instanceof Error ? cause.message : 'Không thể cập nhật tin. Vui lòng thử lại.');
      confirming.current = false;
    }
  };

  return (
    <div className="space-y-7 pb-4">
      <header className="flex flex-wrap items-start justify-between gap-5">
        <div><h1 className="text-[28px] font-extrabold tracking-tight text-ink sm:text-[32px]">Tin đăng của tôi</h1><p className="mt-2 text-sm leading-6 text-muted">Chăm chút nội dung, theo dõi xét duyệt và đưa phòng đến đúng người thuê.</p></div>
        <Link href="/landlord/listings/create" className={createClass}><span aria-hidden="true" className="text-xl leading-none">+</span>Tạo phòng & tin nháp</Link>
      </header>

      {error ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6"><h2 className="font-semibold">Chưa thể tải tin đăng</h2><p className="mt-2 text-sm">{error}</p><Button variant="outline" className="mt-4" onClick={retry}>Thử lại</Button></div>
      ) : (
        <>
          <section aria-label="Lọc tin đăng" className="space-y-5">
            <div className="max-w-lg">
              <Input id="listing-search" type="search" label="Tìm tin đăng" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nhập tiêu đề hoặc số phòng…" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>} />
            </div>
            <div role="group" aria-label="Trạng thái tin đăng" className="flex gap-1 overflow-x-auto border-b border-line">
              {(['ALL', ...statuses] as const).map((status) => {
                const count = status === 'ALL' ? items.length : items.filter((item) => item.postStatus === status).length;
                return <button key={status} type="button" aria-pressed={filter === status} onClick={() => setFilter(status)} className={cn('relative flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition', filter === status ? 'border-primary text-primary' : 'border-transparent text-muted hover:bg-page hover:text-ink')}>
                  {status === 'ALL' ? 'Tất cả' : postStatusLabel[status]}<span className={cn('rounded-md px-1.5 py-0.5 text-xs tabular-nums', filter === status ? 'bg-primary-soft' : 'bg-page')}>{count}</span>
                </button>;
              })}
            </div>
          </section>

          {notice && <p role="status" className="rounded-xl bg-primary-soft px-4 py-3 text-sm text-primary-dark">{notice}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted"><p role="status">{visible.length} tin{filter !== 'ALL' ? ` · ${postStatusLabel[filter].toLowerCase()}` : ''}{query ? ' phù hợp tìm kiếm' : ''}</p>{(query || filter !== 'ALL') && <button type="button" className="font-semibold text-primary hover:underline" onClick={() => { setSearch(''); setFilter('ALL'); }}>Xóa bộ lọc</button>}</div>

          {visible.length ? (
            <section aria-label="Danh sách tin đăng" className="overflow-hidden rounded-2xl border border-line">
              {visible.map((room) => <ListingRow key={room.detail.postId} room={room} onAction={open} />)}
            </section>
          ) : (
            <section className="rounded-2xl border border-dashed border-line px-6 py-16 text-center">
              <div aria-hidden="true" className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 21V3h11l5 5v13H4Zm11-18v5h5M8 12h8M8 16h5" /></svg></div>
              <h2 className="text-lg font-bold">{items.length ? 'Không có tin phù hợp' : 'Bắt đầu với căn phòng đầu tiên'}</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{items.length ? 'Thử tiêu đề, số phòng khác hoặc chọn một trạng thái khác.' : 'Tạo phòng và lưu tin nháp. Bạn có thể hoàn thiện ảnh, nội dung trước khi gửi duyệt.'}</p>
              {!items.length && <Link className={`${createClass} mt-6`} href="/landlord/listings/create">Tạo phòng & tin nháp</Link>}
            </section>
          )}
        </>
      )}

      <Modal open={!!target} onClose={() => setTarget(null)} title={target ? actions[target.action].title : undefined}>
        {target && <div className="space-y-5">
          <div><p className="font-semibold">{selected?.detail.title ?? 'Tin đăng đã thay đổi'}</p><p className="mt-2 text-sm leading-6 text-muted">{actions[target.action].description}</p></div>
          {target.action === 'submit' && <div className="rounded-xl bg-page p-4"><SubmissionChecklist requirements={requirements} /></div>}
          {target.action === 'submit' && requirements.some((item) => !item.met) && <p className="text-sm text-amber-800">Hoàn thiện các mục còn thiếu trong phần chỉnh sửa trước khi gửi duyệt.</p>}
          {failure && <p role="alert" className="text-sm text-red-600">{failure}</p>}
          <div className="flex flex-wrap justify-end gap-3"><Button variant="outline" onClick={() => setTarget(null)}>Quay lại</Button><Button variant={target.action === 'delete' ? 'danger' : 'primary'} onClick={confirm} disabled={!!error || !selected || (target.action === 'submit' && requirements.some((item) => !item.met))}>{actions[target.action].button}</Button></div>
        </div>}
      </Modal>
    </div>
  );
}

function ListingRow({ room, onAction }: { room: CatalogRoom; onAction: (id: string, action: Action) => void }) {
  const { detail, postStatus } = room;
  const editable = postStatus === 'DRAFT' || postStatus === 'REJECTED';
  return (
    <article className="border-b border-line p-4 last:border-b-0 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)] xl:grid-cols-[120px_minmax(0,1fr)_auto]">
        <ListingPhoto src={detail.imageUrls[0]} alt={`Ảnh ${detail.title}`} className="aspect-[16/9] rounded-xl sm:aspect-[4/3]" />
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2"><ListingStatus status={postStatus} /><span className="text-xs text-muted">Phòng: {roomStatusLabel[room.roomStatus]}</span></div>
          <h2 className="break-words text-base font-bold leading-6 tracking-tight">{detail.title}</h2>
          <p className="mt-1 text-xs leading-5 text-muted">{detail.houseName} / {detail.floorName} / Phòng {detail.roomNumber}</p>
          <p className="mt-2 text-sm"><strong className="font-bold">{formatVND(detail.rentalPrice)}</strong><span className="text-muted"> / tháng · {detail.area} m² · {detail.maxTenants} người</span></p>
        </div>
        <div className="flex flex-wrap items-start gap-2 sm:col-start-2 xl:col-start-auto xl:max-w-[230px] xl:justify-end">
          {editable && <><Link href={`/landlord/listings/create?roomId=${detail.roomId}`} className="rounded-xl border border-line px-3 py-2 text-[13px] font-semibold hover:border-ink">Chỉnh sửa</Link><Button size="sm" className="py-2" onClick={() => onAction(detail.roomId, 'submit')}>Gửi duyệt</Button></>}
          {postStatus === 'APPROVED' && <><Link href={`/rooms/${detail.roomId}`} className="rounded-xl border border-line px-3 py-2 text-[13px] font-semibold hover:border-ink">Xem tin</Link><Button size="sm" variant="ghost" className="py-2" onClick={() => onAction(detail.roomId, 'hide')}>Ẩn tin</Button></>}
          {postStatus === 'HIDDEN' && <Button size="sm" className="py-2" onClick={() => onAction(detail.roomId, 'unhide')}>Hiện lại</Button>}
          <Button size="sm" variant="ghost" className="py-2 text-red-600 hover:text-red-700" onClick={() => onAction(detail.roomId, 'delete')}>Xóa</Button>
        </div>
      </div>
      <p className={cn('mt-3 break-words rounded-lg px-3 py-2 text-xs leading-5 sm:ml-[136px]', postStatus === 'REJECTED' ? 'bg-red-50 text-red-800' : 'bg-page text-muted')}>
        {postStatus === 'REJECTED' && room.rejectReason ? `Lý do từ chối: ${room.rejectReason}` : postStatus === 'HIDDEN' && room.adminRemoveReason ? `Tin bị Admin gỡ: ${room.adminRemoveReason}` : hints[postStatus]}
      </p>
    </article>
  );
}
