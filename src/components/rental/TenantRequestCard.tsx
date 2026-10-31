import type { ReactNode } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { ListingPhoto } from '@/components/rooms/ListingVisuals';
import type { RentalRequest } from '@/services/backend/rental';
import type { RoomDetail } from '@/services/backend/rooms';
import ContactCard from './ContactCard';

export default function TenantRequestCard({ request, room, status, onCancel }: {
  request: RentalRequest;
  room?: RoomDetail;
  status: ReactNode;
  onCancel: () => void;
}) {
  const accepted = request.status === 'ACCEPTED';
  const title = room?.title || `Phòng ${request.roomId}`;
  return <article className="tenant-request">
    <header className="tenant-request-heading">
      <ListingPhoto src={room?.primaryImageUrl} alt={`Ảnh ${title}`} className="tenant-request-photo" />
      <div className="min-w-0">
        <h2><Link className="text-base font-bold leading-6 text-ink hover:text-primary" href={`/rooms/${request.roomId}`}>{title}</Link></h2>
        {room && <p className="mt-1 text-sm text-muted">{[room.houseName, room.floorName, room.roomNumber && `Phòng ${room.roomNumber}`].filter(Boolean).join(' · ')}</p>}
        <p className="mt-2 text-xs text-muted">Gửi {new Date(request.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Bangkok', dateStyle: 'short', timeStyle: 'short' })}</p>
      </div>
      <div className="tenant-request-status">{status}</div>
    </header>
    <div className={`tenant-request-body${accepted ? ' tenant-request-body-accepted' : ''}`}>
      <div className="tenant-request-message">
        <h3 className="text-xs font-semibold text-muted">Lời nhắn của bạn</h3>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{request.note || 'Không có lời nhắn.'}</p>
        {request.rejectReason && <div className="tenant-request-rejection"><h3 className="font-semibold">Lý do từ chối</h3><p className="mt-1 whitespace-pre-wrap break-words">{request.rejectReason}</p></div>}
      </div>
      {accepted && <ContactCard request={request} />}
    </div>
    <footer className="tenant-request-footer">
      <span className="text-xs text-muted">Mã yêu cầu {request.id.slice(0, 8)}</span>
      {accepted && <Link href="/contracts" className="tenant-request-contract-link">Xem hợp đồng</Link>}
      {request.status === 'PENDING' && <Button size="sm" variant="outline" onClick={onCancel}>Hủy yêu cầu</Button>}
    </footer>
  </article>;
}
