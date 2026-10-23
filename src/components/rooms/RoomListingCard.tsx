import Link from 'next/link';
import Image from 'next/image';
import { type RoomSummary } from '@/services/mock/rooms';
import { formatVND } from '@/lib/utils';
import FavoriteButton from './FavoriteButton';

export default function RoomListingCard({ room }: { room: RoomSummary }) {
  return <article className="min-w-0">
    <div className="relative">
      <Link href={`/rooms/${room.roomId}`} className="relative block aspect-[3/2] overflow-hidden rounded-2xl bg-page">
        <Image src={room.primaryImageUrl} alt={room.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px" className="object-cover" />
      </Link>
      <div className="absolute right-3 top-3"><FavoriteButton roomId={room.roomId} /></div>
    </div>
    <Link href={`/rooms/${room.roomId}`} className="mt-3 block">
      <h2 className="truncate text-[15px] font-bold text-ink">{room.title}</h2>
      <p className="mt-1 text-sm"><strong>{formatVND(room.rentalPrice)}</strong> / tháng</p>
      <p className="mt-1 text-sm text-muted">{room.area} m² · Tối đa {room.maxTenants} người</p>
      <p className="mt-1 text-sm text-muted">{room.district}, {room.city}</p>
      <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${room.available ? 'bg-emerald-50 text-emerald-700' : 'bg-page text-muted'}`}>{room.available ? 'Còn trống' : 'Đã cho thuê'}</span>
    </Link>
  </article>;
}
