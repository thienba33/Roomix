'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import TenantShell from '@/components/layouts/TenantShell';
import RoomListingCard from '@/components/rooms/RoomListingCard';
import { useAuth } from '@/components/auth/AuthProvider';
import { listFavorites, FAVORITES_EVENT, CATALOG_EVENT, AUTH_EVENT, type FavoriteResponse } from '@/services/mock/rooms';

export default function FavoritesPage() {
  const { user, ready } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteResponse[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    const sync = () => {
      try { setFavorites(listFavorites()); setError(''); }
      catch (e) { setFavorites([]); setError(e instanceof Error ? e.message : 'Không thể tải danh sách.'); }
    };
    sync();
    [FAVORITES_EVENT, CATALOG_EVENT, AUTH_EVENT, 'storage'].forEach((name) => window.addEventListener(name, sync));
    return () => [FAVORITES_EVENT, CATALOG_EVENT, AUTH_EVENT, 'storage'].forEach((name) => window.removeEventListener(name, sync));
  }, [user?.id]);
  return <TenantShell><div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
    <h1 className="text-[28px] font-extrabold text-ink">Phòng yêu thích</h1>
    {!ready ? <p className="py-10 text-muted">Đang tải phòng yêu thích…</p> : error ? <p role="alert" className="mt-6 text-red-600">{error}</p>
      : <><p role="status" className="mt-2 text-sm text-muted">{favorites.length} phòng đã lưu</p>
        {favorites.length ? <div className="room-grid mt-7 gap-x-5 gap-y-8">{favorites.map((f) => <RoomListingCard key={f.favoriteId} room={f.room} />)}</div>
          : <div className="py-20 text-center"><h2 className="font-bold">Chưa có phòng yêu thích</h2><p className="mt-2 text-sm text-muted">Nhấn biểu tượng trái tim để lưu phòng.</p><Link className="mt-5 inline-block font-semibold text-primary" href="/">Khám phá phòng</Link></div>}
      </>}
  </div></TenantShell>;
}
