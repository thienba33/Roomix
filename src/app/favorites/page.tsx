'use client';
import Link from 'next/link';
import TenantShell from '@/components/layouts/TenantShell';
import RoomListingCard from '@/components/rooms/RoomListingCard';
import { useAuth } from '@/components/auth/AuthProvider';
import { useFavorites } from '@/hooks/useFavorites';

export default function FavoritesPage() {
  const { user, ready } = useAuth();
  const { items: favorites, ready: loaded, error, retry } = useFavorites();
  return <TenantShell><div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
    <h1 className="text-[28px] font-extrabold text-ink">Phòng yêu thích</h1>
    {!ready || !loaded ? <p className="py-10 text-muted">Đang tải phòng yêu thích…</p> : user?.role !== 'TENANT' ? <div className="mx-auto max-w-md py-20 text-center"><h2 className="text-xl font-bold">Lưu những phòng bạn yêu thích</h2><p className="mt-3 text-sm leading-6 text-muted">Đăng nhập bằng tài khoản để lưu phòng và xem lại bất cứ lúc nào.</p></div> : error ? <div role="alert" className="mt-6 text-red-600"><p>{error}</p><button onClick={retry} className="mt-2 text-sm font-semibold underline">Thử lại</button></div>
      : <><p role="status" className="mt-2 text-sm text-muted">{favorites.length} phòng đã lưu</p>
        {favorites.length ? <div className="room-grid mt-7 gap-x-5 gap-y-8">{favorites.map((f) => <RoomListingCard key={f.favoriteId} room={f.room} />)}</div>
          : <div className="py-20 text-center"><h2 className="font-bold">Chưa có phòng yêu thích</h2><p className="mt-2 text-sm text-muted">Nhấn biểu tượng trái tim để lưu phòng.</p><Link className="mt-5 inline-block font-semibold text-primary" href="/">Khám phá phòng</Link></div>}
      </>}
  </div></TenantShell>;
}
