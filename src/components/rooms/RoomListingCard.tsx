'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { type RoomSummary } from '@/services/backend/rooms';
import { formatVND } from '@/lib/utils';
import FavoriteButton from './FavoriteButton';

function DetailIcon({ children }: { children: ReactNode }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">{children}</svg>;
}

const AMENITIES = [
  { key: 'hasPrivateBathroom', label: 'WC riêng' },
  { key: 'hasAirConditioner', label: 'Điều hòa' },
  { key: 'hasWaterHeater', label: 'Nóng lạnh' },
  { key: 'hasBalcony', label: 'Ban công' },
] as const;

export default function RoomListingCard({ room }: { room: RoomSummary }) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const hasImage = !!room.primaryImageUrl && failedImage !== room.primaryImageUrl;
  const amenities = AMENITIES.filter(({ key }) => room[key]);
  const location = [room.ward, room.district, room.city].filter(Boolean).join(', ');
  const fullAddress = [room.addressStreet, location].filter(Boolean).join(', ');
  const unavailable = room.rented || !room.available;

  return (
    <article className="min-w-0">
      <div className="relative">
        <Link href={`/rooms/${room.roomId}`} aria-label={`Xem phòng: ${room.title}`} className="relative block aspect-[4/3] overflow-hidden rounded-[18px] bg-page">
          {hasImage ? (
            <Image unoptimized
              src={room.primaryImageUrl}
              alt={room.title}
              fill
              sizes="(max-width: 639px) 100vw, (max-width: 959px) 50vw, (max-width: 1279px) 33vw, 360px"
              className="object-cover"
              onError={() => setFailedImage(room.primaryImageUrl)}
            />
          ) : (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8" cy="8" r="1.5" /><path d="m3 17 5-5 4 4 4-6 5 7" /></svg>
              <span className="text-xs">Chưa có ảnh phòng</span>
            </span>
          )}
          {unavailable && <span className="absolute bottom-3 left-3 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-secondary shadow-sm">{room.rented ? 'Đã cho thuê' : 'Hiện chưa nhận thuê'}</span>}
        </Link>
        <div className="absolute right-3 top-3"><FavoriteButton roomId={room.roomId} /></div>
      </div>

      <Link href={`/rooms/${room.roomId}`} className="group mt-4 block rounded-lg">
        <h2 className="line-clamp-2 min-h-12 text-base font-bold leading-6 tracking-[-0.3px] text-ink group-hover:text-primary" title={room.title}>{room.title}</h2>
        <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5 text-muted">
          <strong className="text-[22px] font-extrabold leading-8 tracking-[-0.7px] text-ink">{formatVND(room.rentalPrice)}</strong>
          <span className="text-xs">/ tháng</span>
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <DetailIcon><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 9h4V4m12 11h-4v5" /></DetailIcon>
            {room.area.toLocaleString('vi-VN')} m²
          </span>
          <span className="inline-flex items-center gap-1.5">
            <DetailIcon><circle cx="9" cy="8" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-16a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 4v2" /></DetailIcon>
            Tối đa {room.maxTenants} người
          </span>
        </div>
        <p className="mt-2.5 flex min-h-10 items-start gap-1.5 text-[13px] leading-5 text-muted" title={fullAddress || undefined}>
          <span className="mt-0.5"><DetailIcon><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></DetailIcon></span>
          <span className="line-clamp-2">{location || room.addressStreet || 'Chưa có thông tin vị trí'}</span>
        </p>

        <div className="mt-3 flex min-h-12 flex-wrap content-start gap-1.5 border-t border-line pt-3">
          {amenities.map(({ key, label }) => (
            <span key={key} className="inline-flex items-center gap-1 rounded-md bg-primary-soft/70 px-2 py-1 text-[11px] font-medium leading-4 text-primary-dark">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
              {label}
            </span>
          ))}
          {amenities.length === 0 && <span className="text-xs leading-6 text-muted">Xem mô tả phòng</span>}
        </div>
      </Link>
    </article>
  );
}
