'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import TenantShell from '@/components/layouts/TenantShell';
import RoomCard from '@/components/layouts/RoomCard';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { rooms } from '@/lib/data';
import type { Room } from '@/types';
import { FAVORITES_EVENT, getFavoriteIds, setFavoriteIds } from '@/lib/tenant-store';

export default function FavoritesPage() {
  const toast = useToast();
  const [favIds, setFavIds] = useState<number[]>([]);

  useEffect(() => {
    const sync = () => setFavIds(getFavoriteIds());
    sync();
    window.addEventListener(FAVORITES_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(FAVORITES_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const onFavoriteChange = useCallback(
    (room: Room, nowFavorite: boolean) => {
      if (nowFavorite) return;
      const before = getFavoriteIds();
      toast.push('Đã bỏ yêu thích', `${room.name} đã được gỡ khỏi danh sách.`, {
        label: 'Hoàn tác',
        onClick: () => setFavoriteIds([...before, room.id]),
      });
    },
    [toast],
  );

  const favoriteRoomsList = rooms.filter((r) => favIds.includes(r.id));

  return (
    <TenantShell>
      <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-[28px] font-extrabold text-ink">Phòng yêu thích</h1>
        <p className="mt-1 text-sm text-muted" aria-live="polite">{favoriteRoomsList.length} phòng đã lưu</p>

        {favoriteRoomsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg width="76" height="76" viewBox="0 0 24 24" fill="none" stroke="#DDDDDD" strokeWidth="1.2" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
            <p className="mt-6 text-[17px] font-semibold text-ink">Chưa có phòng yêu thích</p>
            <p className="mt-2 text-sm text-muted">Nhấn ♡ ở phòng bạn thích để lưu lại.</p>
            <Link href="/" className="mt-6 inline-block">
              <Button>Khám phá phòng</Button>
            </Link>
          </div>
        ) : (
          <div className="mt-7 room-grid gap-x-5 gap-y-8">
            {favoriteRoomsList.map((room) => (
              <RoomCard key={room.id} room={room} favorite onFavoriteChange={onFavoriteChange} />
            ))}
          </div>
        )}
      </div>
    </TenantShell>
  );
}
