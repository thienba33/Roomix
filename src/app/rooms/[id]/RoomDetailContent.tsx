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
  return <TenantShell><div className="room-detail-page mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
    <Link href="/" className="text-sm font-semibold text-primary">← Quay lại tìm phòng</Link>
    <header className="room-detail-heading">
      <h1>{room.title}</h1>
      <p>{[room.addressStreet, room.ward, room.district, room.city].filter(Boolean).join(', ')}</p>
    </header>
    <div className="room-detail-layout">
      <div className="room-detail-main">
        <RoomGallery key={room.roomId} images={room.imageUrls} title={room.title} />
        <section className="room-detail-section" aria-labelledby="room-facts-title">
          <h2 id="room-facts-title">Thông tin phòng</h2>
          <dl className="room-detail-facts">
            {[['Diện tích', `${room.area} m²`], ['Tầng', room.floorName], ['Số người tối đa', String(room.maxTenants)], ['Tiền đặt cọc', formatVND(room.depositAmount)], ['Ngày có thể thuê', room.availableFrom.split('-').reverse().join('/')], ['Tình trạng', room.available ? 'Chưa cho thuê' : 'Đã cho thuê']].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
        </section>
        <section className="room-detail-section" aria-labelledby="room-amenities-title">
          <h2 id="room-amenities-title">Tiện ích</h2>
          <p className="room-detail-copy">{room.amenitiesDescription}</p>
        </section>
        <section className="room-detail-section" aria-labelledby="room-description-title">
          <h2 id="room-description-title">Mô tả chi tiết</h2>
          <p className="room-detail-copy whitespace-pre-line">{room.description}</p>
        </section>
        <details className="room-detail-report">
          <summary>Báo cáo bài đăng</summary>
          <ReportRoomModal roomTitle={room.title} roomCode={room.roomNumber} />
        </details>
      </div>
      <aside className="room-detail-sidebar" aria-label="Giá thuê và gửi yêu cầu">
        <RoomDetailActions detail={room} />
      </aside>
    </div>
  </div></TenantShell>;
}
