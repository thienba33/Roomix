import TenantShell from '@/components/layouts/TenantShell';
import RoomCard from '@/components/layouts/RoomCard';
import { favoriteRooms } from '@/lib/data';

export default function FavoritesPage() {
  return (
    <TenantShell>
      <div className="mx-auto max-w-7xl px-6 py-6">
        <h1 className="text-[28px] font-extrabold text-ink">Phòng yêu thích</h1>
        <p className="mt-1 text-sm text-muted">{favoriteRooms.length} phòng đã lưu</p>

        <div className="mt-7 grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {favoriteRooms.map((room) => (
            <RoomCard key={room.id} room={room} favorite />
          ))}
        </div>
      </div>
    </TenantShell>
  );
}
