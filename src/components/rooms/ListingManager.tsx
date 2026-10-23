'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/auth/AuthProvider';
import { useCatalog } from '@/hooks/useCatalog';
import { changePostStatus } from '@/services/mock/rooms';
import { formatVND, postStatusLabel, roomStatusLabel } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

export default function ListingManager({ admin = false, roomsOnly = false, postId }: { admin?: boolean; roomsOnly?: boolean; postId?: string }) {
  const { user, openAuth } = useAuth();
  const { items, ready, error } = useCatalog();
  const [filter, setFilter] = useState('ALL');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<{ roomId: string; action: 'submit' | 'hide' | 'unhide' | 'approve' | 'reject' } | null>(null);
  const [reason, setReason] = useState('');
  const [failure, setFailure] = useState('');
  if (!ready) return <p role="status">Đang tải danh sách…</p>;
  if (user?.role !== (admin ? 'ADMIN' : 'LANDLORD')) return <div className="space-y-4"><h1 className="text-2xl font-bold">{admin ? 'Kiểm duyệt tin đăng' : 'Quản lý phòng và tin đăng'}</h1><p>Vui lòng đăng nhập bằng tài khoản {admin ? 'quản trị viên' : 'chủ trọ'}.</p>{admin ? <Link href="/admin/login" className="font-semibold text-primary">Đăng nhập quản trị</Link> : <Button onClick={() => openAuth('login', 'landlord')}>Đăng nhập</Button>}</div>;
  const visible = items.filter((r) => admin ? r.postStatus === 'PENDING' : r.landlordId === user.id).filter((r) => !postId || r.detail.postId === postId).filter((r) => filter === 'ALL' || r.postStatus === filter);
  const confirm = () => {
    if (!target) return;
    try { changePostStatus(target.roomId, target.action, reason); setMessage('Đã cập nhật trạng thái tin đăng.'); setTarget(null); }
    catch (e) { setFailure(e instanceof Error ? e.message : 'Không thể cập nhật.'); }
  };
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-[28px] font-extrabold">{admin ? 'Kiểm duyệt tin đăng' : roomsOnly ? 'Nhà & Phòng' : 'Tin đăng của tôi'}</h1>{!admin && <Link href="/landlord/listings/create" className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white">+ Tạo phòng & tin nháp</Link>}</div>
    {postId && <Link href="/admin/moderation" className="block text-sm text-primary">← Danh sách chờ duyệt</Link>}
    {!admin && <label className="flex items-center gap-3 text-sm">Trạng thái tin <select className="rounded-xl border border-line bg-white p-2" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="ALL">Tất cả</option>{(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'HIDDEN'] as const).map((s) => <option key={s} value={s}>{postStatusLabel[s]}</option>)}</select></label>}
    {message && <p role="status" className="rounded-xl bg-primary-soft p-3 text-sm text-primary">{message}</p>}
    {error && <p role="alert" className="text-red-600">{error}</p>}
    {!error && !visible.length && <p className="rounded-2xl border border-line p-10 text-center text-muted">{admin ? 'Không có tin đang chờ duyệt.' : 'Chưa có phòng hoặc tin đăng ở trạng thái này.'}</p>}
    {visible.map((r) => <article key={r.detail.postId} className="space-y-3 rounded-2xl border border-line bg-white p-5">
      <div className="flex flex-wrap justify-between gap-3"><h2 className="text-lg font-bold">{r.detail.title}</h2><span className="rounded-full bg-page px-3 py-1 text-sm">{postStatusLabel[r.postStatus]}</span></div>
      <p className="text-sm text-muted">{r.detail.houseName} · {r.detail.floorName} · Phòng {r.detail.roomNumber}</p>
      <p className="text-sm">{formatVND(r.detail.rentalPrice)}/tháng · {r.detail.area} m² · Tối đa {r.detail.maxTenants} người · Phòng: {roomStatusLabel[r.roomStatus]}</p>
      <p className="text-sm">Đặt cọc: {formatVND(r.detail.depositAmount)} · Có thể thuê: {r.detail.availableFrom}</p>
      <p className="whitespace-pre-line text-sm leading-6 text-muted">{r.detail.description}</p>
      {!!r.detail.imageUrls.length && <div className="flex gap-2 overflow-x-auto">{r.detail.imageUrls.map((src, i) => <Image unoptimized width={160} height={112} key={`${src}-${i}`} src={src} alt={`Ảnh phòng ${i + 1}`} className="h-28 w-40 rounded-xl object-cover" />)}</div>}
      {r.rejectReason && <p className="text-sm text-red-600">Lý do từ chối: {r.rejectReason}</p>}
      <div className="flex flex-wrap gap-2">
        {!admin && ['DRAFT', 'REJECTED'].includes(r.postStatus) && <Link href={`/landlord/listings/create?roomId=${r.detail.roomId}`} className="rounded-xl border border-line px-4 py-2 text-sm font-semibold">Chỉnh sửa</Link>}
        {(admin ? ['approve', 'reject'] as const : ['DRAFT', 'REJECTED'].includes(r.postStatus) ? ['submit'] as const : r.postStatus === 'APPROVED' ? ['hide'] as const : r.postStatus === 'HIDDEN' ? ['unhide'] as const : []).map((action) => <Button key={action} variant={action === 'reject' ? 'outline' : 'primary'} onClick={() => { setReason(''); setFailure(''); setTarget({ roomId: r.detail.roomId, action }); }}>{({ submit: 'Gửi duyệt', hide: 'Ẩn tin', unhide: 'Hiện lại', approve: 'Duyệt tin', reject: 'Từ chối' })[action]}</Button>)}
        {r.postStatus === 'APPROVED' && <Link href={`/rooms/${r.detail.roomId}`} className="px-4 py-2 text-sm font-semibold text-primary">Xem tin công khai</Link>}
      </div>
    </article>)}
    <Modal open={!!target} onClose={() => setTarget(null)} title="Xác nhận thao tác">
      <div className="space-y-4"><p className="text-sm text-muted">Thay đổi sẽ được cập nhật vào danh sách tin và trang tìm phòng.</p>
        {target?.action === 'reject' && <label className="block text-sm font-semibold">Lý do từ chối<textarea value={reason} onChange={(e) => setReason(e.target.value)} className="mt-2 w-full rounded-xl border border-line p-3" rows={3} /></label>}
        {failure && <p role="alert" className="text-sm text-red-600">{failure}</p>}
        <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setTarget(null)}>Hủy</Button><Button onClick={confirm}>Xác nhận</Button></div>
      </div>
    </Modal>
  </div>;
}
