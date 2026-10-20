import Image from 'next/image';
import { house, rooms } from '@/lib/data';
import { formatPriceShort, roomStatusLabel, roomStatusTone } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

export default function PhongPage() {
  const floors = Array.from(new Set(rooms.map((r) => r.floor))).sort((a, b) => a - b);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[28px] font-extrabold text-ink">Nhà &amp; Phòng</h1>
        <p className="mt-1 text-sm text-muted">{house.name} · {house.address} · {rooms.length} phòng</p>
      </div>

      {floors.map((floor) => {
        const floorRooms = rooms.filter((r) => r.floor === floor).sort((a, b) => a.code.localeCompare(b.code));
        const rented = floorRooms.filter((r) => r.status === 'OCCUPIED').length;
        const available = floorRooms.filter((r) => r.status === 'AVAILABLE').length;
        return (
          <section key={floor}>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-bold text-ink">Tầng {floor}</h2>
              <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-dark">
                Tầng {floor} · {floorRooms.length} phòng · {rented} đang thuê · {available} còn trống
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {floorRooms.map((room) => (
                <Card key={room.id} className="flex gap-3.5 p-4">
                  <Image src={room.image} alt={room.name} width={160} height={160} className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0">
                    <p className="truncate font-bold text-ink">Phòng {room.code}</p>
                    <p className="mt-0.5 truncate text-sm text-muted">{room.size} m² · {room.area}</p>
                    <p className="mt-1 text-sm">
                      <span className="font-bold text-ink">{formatPriceShort(room.price)}</span>
                      <span className="text-muted"> / tháng</span>
                    </p>
                    <div className="mt-2">
                      <Badge tone={roomStatusTone[room.status]} dot>{roomStatusLabel[room.status]}</Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
