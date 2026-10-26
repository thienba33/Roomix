'use client';
import Link from 'next/link';
import RoomGallery from '@/components/rooms/RoomGallery';
import ReportRoomModal from '@/components/rooms/ReportRoomModal';
import Button from '@/components/ui/Button';
import TenantShell from '@/components/layouts/TenantShell';
import { useCatalog } from '@/hooks/useCatalog';
import { formatVND } from '@/lib/utils';
import { findMockUserById } from '@/services/mock/auth';
import RoomDetailActions from './RoomDetailActions';

export default function RoomDetailContent({ id }: { id: string }) {
  const { items, ready, error, retry } = useCatalog();
  if (!ready) return <TenantShell><p role="status" className="p-8">Đang tải thông tin phòng…</p></TenantShell>;
  const catalogRoom = items.find((r) => r.detail.roomId === id && r.postStatus === 'APPROVED');
  const room = catalogRoom?.detail;
  // UC02.5: public landlord profile shows name + posts only — never phone or
  // email (UC02.8 reserves contact details for the ACCEPTED Contact Card).
  const landlord = catalogRoom ? findMockUserById(catalogRoom.landlordId) : null;
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
        {catalogRoom && <section aria-label="Chủ trọ" className="mt-8 rounded-2xl border border-line p-5">
          <h2 className="text-lg font-bold">Chủ trọ</h2>
          <p className="mt-2 text-sm text-muted">{landlord ? landlord.fullName : 'Chủ trọ Roomix'}</p>
          <p className="mt-1 text-xs text-muted">Số điện thoại và email chỉ hiển thị trong Contact Card sau khi yêu cầu của bạn được chấp nhận.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={`/landlords/${catalogRoom.landlordId}`} className="text-sm font-semibold text-primary hover:underline">Xem hồ sơ & các tin đăng của chủ trọ</Link>
            <ReportRoomModal roomTitle={room.title} roomCode={room.roomNumber} />
          </div>
        </section>}
      </div>
      <div className="room-booking self-start lg:sticky lg:top-24"><RoomDetailActions detail={room} /></div>
    </div>
  </div></TenantShell>;
}
