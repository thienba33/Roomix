'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import RoomGallery from '@/components/rooms/RoomGallery';
import { useApiData } from '@/hooks/useApiData';
import { formatVND } from '@/lib/utils';
import { CATALOG_EVENT, getLandlordRoomDetail } from '@/services/backend/rooms';

export default function LandlordListingDetail({ roomId }: { roomId: string }) {
  const load = useCallback(() => getLandlordRoomDetail(roomId), [roomId]);
  const { data: room, ready, error, retry } = useApiData(
    `landlord-room:${roomId}`,
    load,
    null,
    CATALOG_EVENT,
  );

  if (!ready) {
    return <p role="status" className="py-10 text-muted">Đang tải chi tiết phòng…</p>;
  }
  if (error || !room) {
    return (
      <div role="alert" className="space-y-4 rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-xl font-bold text-red-800">Không thể tải chi tiết phòng</h1>
        <p className="text-sm text-red-700">{error || 'Không tìm thấy phòng thuộc tài khoản của bạn.'}</p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={retry}>Thử lại</Button>
          <Link href="/landlord/listings" className="inline-flex items-center text-sm font-semibold text-primary">
            Về danh sách bài đăng
          </Link>
        </div>
      </div>
    );
  }

  const address = [room.addressStreet, room.ward, room.district, room.city].filter(Boolean).join(', ');
  const amenities = [
    room.hasPrivateBathroom && 'WC riêng',
    room.hasAirConditioner && 'Điều hòa',
    room.hasWaterHeater && 'Nóng lạnh',
    room.hasBalcony && 'Ban công',
    room.amenitiesDescription,
  ].filter(Boolean).join(' · ');

  return (
    <div className="space-y-7 pb-8">
      <header>
        <Link href="/landlord/listings" className="text-sm font-semibold text-primary">
          ← Quay lại bài đăng
        </Link>
        <h1 className="mt-4 text-3xl font-extrabold text-ink">{room.title}</h1>
        <p className="mt-2 text-sm text-muted">{address}</p>
      </header>

      <RoomGallery images={room.imageUrls} title={room.title} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <h2 className="text-xl font-bold">Nội dung bài đăng</h2>
          <p className="mt-4 whitespace-pre-line leading-7 text-muted">{room.description}</p>
          <h2 className="mt-7 text-xl font-bold">Tiện ích</h2>
          <p className="mt-3 leading-7 text-muted">{amenities || 'Chưa cập nhật tiện ích.'}</p>
        </section>

        <aside className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <h2 className="text-lg font-bold">Thông tin phòng</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <Detail label="Nhà" value={room.houseName} />
            <Detail label="Tầng / phòng" value={`${room.floorName} · ${room.roomNumber}`} />
            <Detail label="Diện tích" value={`${room.area} m²`} />
            <Detail label="Số người tối đa" value={`${room.maxTenants} người`} />
            <Detail label="Giá thuê" value={`${formatVND(room.rentalPrice)}/tháng`} />
            <Detail label="Tiền đặt cọc" value={formatVND(room.depositAmount)} />
            <Detail label="Ngày có thể thuê" value={room.availableFrom.split('-').reverse().join('/')} />
            <Detail label="Tình trạng thuê" value={room.rented ? 'Đang có người thuê' : 'Đang trống'} />
          </dl>
        </aside>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line pb-3 last:border-0 last:pb-0">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-semibold text-ink">{value}</dd>
    </div>
  );
}
