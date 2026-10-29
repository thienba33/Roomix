'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { formatVND } from '@/lib/utils';
import { useAuth } from '@/components/auth/AuthProvider';
import FavoriteButton from '@/components/rooms/FavoriteButton';
import { type RoomDetail } from '@/services/backend/rooms';
import { useRental } from '@/hooks/useRental';
import { sendRental } from '@/services/backend/rental';
export default function RoomDetailActions({ detail }: { detail: RoomDetail }) {
  const { user, requireTenant } = useAuth();
  const rental = useRental();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(''); const [error, setError] = useState('');
  const pending = rental.requests.some((r) => r.roomId === detail.roomId && r.status === 'PENDING');
  const contract = rental.tenancies.find((t) => t.roomId === detail.roomId && ['PENDING', 'ACTIVE'].includes(t.status));
  const send = async () => {
    if (!requireTenant() || lock.current) return;
    lock.current = true; setBusy(true);
    try { await sendRental(detail.roomId, note); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không thể gửi yêu cầu.'); }
    finally { lock.current = false; setBusy(false); }
  };
  return <div className="room-rental-actions space-y-4">
    <div className="flex items-center justify-between gap-3"><p className="room-rental-price">{formatVND(detail.rentalPrice)}<span>/ tháng</span></p><FavoriteButton roomId={detail.roomId} /></div>
    <p className="text-sm">Tiền cọc: {formatVND(detail.depositAmount)}</p>
    <p className="text-xs leading-5 text-muted">Tiền điện, nước và các khoản phí được xác định trong thỏa thuận thuê.</p>
    {!detail.available && <p role="status" className="rounded-md bg-page p-3 text-sm text-muted">Phòng đã được thuê và hiện không nhận yêu cầu mới. Bạn vẫn có thể xem thông tin hoặc tìm phòng khác.</p>}
    {user && user.role !== 'TENANT' && <p className="text-sm text-muted">Lưu yêu thích và gửi yêu cầu thuê dành cho tài khoản khách thuê.</p>}
    {pending || contract ? <p className="text-sm text-muted">{contract ? contract.status === 'PENDING' ? 'Hợp đồng đang chờ chủ trọ xác nhận cọc.' : 'Bạn đang thuê phòng này.' : 'Yêu cầu quan tâm của bạn đang chờ phản hồi.'}</p> : <>
      <label className="block text-sm font-semibold">Lời nhắn (không bắt buộc)<textarea rows={3} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} className="mt-2 w-full rounded-md border border-line p-3 text-sm" /></label>
      <Button className="w-full" onClick={send} disabled={busy || !rental.ready || !!rental.error || !detail.available || (!!user && user.role !== 'TENANT')}>Gửi yêu cầu quan tâm</Button>
    </>}
    {rental.error && <p role="alert" className="text-sm text-red-600">{rental.error}</p>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    {user?.role === 'TENANT' && <Link href={contract ? '/contracts' : '/requests'} className="block text-center text-sm font-semibold text-primary">{contract ? 'Xem hợp đồng của tôi' : 'Xem yêu cầu của tôi'}</Link>}
  </div>;
}
