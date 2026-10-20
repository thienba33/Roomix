'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Room } from '@/types';
import { formatPriceShort, formatRating, roomStatusLabel, roomStatusTone } from '@/lib/utils';
import Badge from '@/components/ui/Badge';

export default function RoomCard({ room, favorite = false }: { room: Room; favorite?: boolean }) {
  const [fav, setFav] = useState(favorite);
  return (
    <div className="group">
      <div className="relative">
        <Link href={`/rooms/${room.id}`}>
          <Image src={room.image} alt={room.name} width={640} height={427} className="aspect-[3/2] w-full rounded-[14px] object-cover" />
        </Link>
        <button
          onClick={() => setFav((f) => !f)}
          aria-label="Yêu thích"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full transition hover:scale-110"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill={fav ? '#4F46E5' : 'rgba(0,0,0,0.22)'} stroke="white" strokeWidth="1.8" strokeLinejoin="round" className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </button>
      </div>
      <Link href={`/rooms/${room.id}`} className="block pt-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[15px] font-bold text-ink">{room.name}</h3>
          <span className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-ink">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" /></svg>
            {formatRating(room.rating)}
          </span>
        </div>
        <p className="mt-1 text-[15px]"><span className="font-bold text-ink">{formatPriceShort(room.price)}</span> <span className="text-[#484848]">/ tháng</span></p>
        <p className="mt-0.5 text-[13px] text-muted">{room.size} m² · Tầng {room.floor} · {room.area}</p>
        <div className="mt-2.5">
          <Badge tone={roomStatusTone[room.status]} dot>{roomStatusLabel[room.status]}</Badge>
        </div>
      </Link>
    </div>
  );
}
