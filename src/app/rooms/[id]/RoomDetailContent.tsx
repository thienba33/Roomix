'use client';
import Link from 'next/link';
import RoomGallery from '@/components/rooms/RoomGallery';
import ReportRoomModal from '@/components/rooms/ReportRoomModal';
import Button from '@/components/ui/Button';
import TenantShell from '@/components/layouts/TenantShell';
import { useCallback } from 'react';
import { useApiData } from '@/hooks/useApiData';
import { getRoomDetail, CATALOG_EVENT } from '@/services/backend/rooms';
import { formatVND } from '@/lib/utils';
import RoomDetailActions from './RoomDetailActions';

export default function RoomDetailContent({ id }: { id: string }) {
  const load = useCallback(() => getRoomDetail(id), [id]);
  const { data: room, ready, error, retry } = useApiData(`room:${id}`, load, null, CATALOG_EVENT);
  if (!ready) return <TenantShell><p role="status" className="p-8">Đang tải thông tin phòng…</p></TenantShell>;
  if (error || !room) return <TenantShell><div className="p-10 text-center"><h1 className="text-2xl font-bold">{error || 'Tin đăng không còn khả dụng'}</h1>{error && <Button onClick={retry} variant="outline" className="mx-auto mt-5">Thử lại</Button>}<Link href="/" className="mt-5 inline-block text-primary">Về trang tìm phòng</Link></div></TenantShell>;
  return <TenantShell><div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 room-detail-page">
    <Link href="/" className="text-sm font-semibold text-primary">← Quay lại tìm phòng</Link>
    <h1 className="mt-4 text-[28px] font-extrabold text-ink">{room.title}</h1>
    <p className="mt-2 text-sm text-muted">{[room.addressStreet, room.ward, room.district, room.city].filter(Boolean).join(', ')}</p>
    <RoomGallery key={room.roomId} images={room.imageUrls} title={room.title} />
    <div className="mt-8 grid gap-8 lg:grid-cols-3 room-detail-columns">
      <div className="lg:col-span-2 room-detail-body">
        <h2 className="text-xl font-bold">Thông tin phòng</h2>
        <dl className="mt-4 grid grid-cols-2 gap-5 rounded-2xl border border-line p-5">
          {[['Diện tích', `${room.area} m²`], ['Tầng', room.floorName], ['Số người tối đa', String(room.maxTenants)], ['Tiền đặt cọc', formatVND(room.depositAmount)], ['Ngày có thể thuê', room.availableFrom.split('-').reverse().join('/')], ['Tình trạng', room.available ? 'Chưa cho thuê' : 'Đã cho thuê']].map(([label, value]) => <div key={label}><dt className="text-sm text-muted">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}
        </dl>
        <h2 className="mt-7 text-xl font-bold">Tiện ích</h2><p className="mt-3 leading-7 text-muted">{room.amenitiesDescription}</p>
        <h2 className="mt-7 text-xl font-bold">Mô tả chi tiết</h2><p className="mt-3 whitespace-pre-line leading-7 text-muted">{room.description}</p>
        <div className="mt-8"><ReportRoomModal roomTitle={room.title} roomCode={room.roomNumber} /></div>
      </div>
      <div className="room-booking self-start lg:sticky lg:top-24"><RoomDetailActions detail={room} /></div>
    </div>
  </div></TenantShell>;
}
