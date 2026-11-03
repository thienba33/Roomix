'use client';
import Link from 'next/link';
import RoomListingCard from '@/components/rooms/RoomListingCard';
import { useFavorites } from '@/hooks/useFavorites';

export default function TenantFavoritesPage() {
  const { items: favorites, ready: loaded, error, retry } = useFavorites();

  return (
    <div className="favorites-page mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="sr-only">Phòng yêu thích</h1>
      {!loaded ? (
        <p className="py-10 text-muted">Đang tải phòng yêu thích…</p>
      ) : error ? (
        <div role="alert" className="mt-6 text-red-600">
          <p>{error}</p>
          <button onClick={retry} className="mt-2 text-sm font-semibold underline">
            Thử lại
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
            <p role="status" className="text-sm font-semibold text-ink">
              {favorites.length} phòng đã lưu
            </p>
            <Link href="/tenant/search" className="text-sm font-semibold text-primary hover:underline">
              Tìm thêm phòng
            </Link>
          </div>
          {favorites.length ? (
            <div className="favorites-grid mt-4">
              {favorites.map((f) => (
                <RoomListingCard key={f.favoriteId} room={f.room} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <h2 className="font-bold text-ink">Chưa có phòng yêu thích</h2>
              <p className="mt-2 text-sm text-muted">Nhấn biểu tượng trái tim ở danh sách phòng để lưu lại.</p>
              <Link className="mt-5 inline-block font-semibold text-primary" href="/tenant/search">
                Khám phá phòng ngay
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}

