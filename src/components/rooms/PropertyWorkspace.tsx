'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import Button from '@/components/ui/Button';
import { useCatalog } from '@/hooks/useCatalog';
import { useRental } from '@/hooks/useRental';
import { cn, formatVND, postStatusLabel, roomStatusLabel } from '@/lib/utils';
import { propertyFixtures, type CatalogRoom } from '@/services/mock/rooms';
import type { RoomStatus } from '@/types';

type Floor = { id: string; name: string; number: number; rooms: CatalogRoom[] };
type House = { id: string; name: string; address: string; floors: Floor[] };

function groupProperties(landlordId: string, rooms: CatalogRoom[]): House[] {
  const houses = new Map<string, House>();
  const floors = new Map<string, Floor>();
  const addFloor = (detail: {
    houseId: string; houseName: string; floorId: string; floorName: string;
    floorNumber: number; addressStreet: string; district: string; city: string;
  }) => {
    let house = houses.get(detail.houseId);
    if (!house) {
      house = { id: detail.houseId, name: detail.houseName, address: [detail.addressStreet, detail.district, detail.city].filter(Boolean).join(', '), floors: [] };
      houses.set(detail.houseId, house);
    }
    let floor = floors.get(detail.floorId);
    if (!floor) {
      floor = { id: detail.floorId, name: detail.floorName, number: detail.floorNumber, rooms: [] };
      floors.set(detail.floorId, floor);
      house.floors.push(floor);
    }
    return floor;
  };
  propertyFixtures.filter((floor) => floor.landlordId === landlordId).forEach(addFloor);
  rooms.forEach((room) => addFloor(room.detail).rooms.push(room));
  return [...houses.values()].map((house) => ({ ...house, floors: house.floors.sort((a, b) => a.number - b.number || a.name.localeCompare(b.name, 'vi')) }));
}

const statusClass: Record<RoomStatus, string> = {
  AVAILABLE: 'bg-emerald-50 text-emerald-700',
  OCCUPIED: 'bg-slate-100 text-slate-700',
  RESERVED: 'bg-amber-50 text-amber-700',
  MAINTENANCE: 'bg-rose-50 text-rose-700',
};

export default function PropertyWorkspace() {
  const { user, ready: authReady } = useAuth();
  const catalog = useCatalog();
  const rental = useRental();

  if (!authReady || !catalog.ready || !rental.ready) return <div role="status" className="space-y-5"><h1 className="text-[28px] font-extrabold">Nhà & Phòng</h1><p className="text-muted">Đang tải nhà và phòng…</p><div aria-hidden="true" className="h-56 animate-pulse rounded-2xl bg-page" /></div>;
  if (user?.role !== 'LANDLORD') return <p role="alert">Bạn cần đăng nhập bằng tài khoản chủ trọ để xem nhà và phòng.</p>;
  return <Properties key={user.id} landlordId={user.id} items={catalog.items.filter((room) => room.landlordId === user.id)} activeRoomIds={new Set(rental.tenancies.filter((tenancy) => tenancy.status === 'ACTIVE').map((tenancy) => tenancy.roomId))} error={catalog.error || rental.error} />;
}

function Properties({ landlordId, items, activeRoomIds, error }: { landlordId: string; items: CatalogRoom[]; activeRoomIds: Set<string>; error: string }) {
  const [houseChoice, setHouseChoice] = useState('');
  const [floorChoice, setFloorChoice] = useState('');
  const rooms = items.map((room) => activeRoomIds.has(room.detail.roomId) ? { ...room, roomStatus: 'OCCUPIED' as const } : room);
  const houses = groupProperties(landlordId, rooms);
  const selectedHouse = houses.find((house) => house.id === houseChoice) ?? houses[0];
  const selectedFloor = selectedHouse?.floors.find((floor) => floor.id === floorChoice);
  const visibleFloors = selectedFloor ? [selectedFloor] : selectedHouse?.floors ?? [];
  const available = rooms.filter((room) => room.roomStatus === 'AVAILABLE').length;
  const occupied = rooms.filter((room) => room.roomStatus === 'OCCUPIED').length;
  const other = rooms.length - available - occupied;
  const canCreate = propertyFixtures.some((floor) => floor.landlordId === landlordId);

  return <div className="space-y-7 pb-5">
    <header className="flex flex-wrap items-start justify-between gap-5">
      <div><h1 className="text-[28px] font-extrabold tracking-tight text-ink sm:text-[32px]">Nhà & Phòng</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted">Xem các phòng theo từng nhà, tầng và theo dõi tình trạng cho thuê.</p></div>
      {canCreate && <Link href="/landlord/listings/create" className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">+ Tạo phòng & tin nháp</Link>}
    </header>
    {error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6"><h2 className="font-semibold">Chưa thể tải nhà và phòng</h2><p className="mt-2 text-sm">{error}</p><Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Tải lại trang</Button></div> : <>
      <section aria-label="Tổng quan phòng" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {([['Tổng phòng', rooms.length], ['Còn trống', available], ['Đang thuê', occupied], ['Trạng thái khác', other]] as const).map(([label, value]) => <div key={label} className="rounded-2xl border border-line bg-white px-4 py-4 sm:px-5"><p className="text-xs font-medium text-muted">{label}</p><p className="mt-2 text-2xl font-bold tabular-nums text-ink">{value}</p></div>)}
      </section>
      {!houses.length ? <div className="rounded-2xl border border-line bg-page px-6 py-12 text-center"><h2 className="text-lg font-bold">Chưa có nhà hoặc tầng nào</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">Tài khoản này chưa được cấu hình nhà và tầng trong dữ liệu mô phỏng. Hãy liên hệ quản trị viên để kiểm tra.</p></div> : <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <section aria-label="Danh sách nhà" className="rounded-2xl border border-line bg-white p-3">
          <div className="px-3 pb-2 pt-2 text-sm font-bold text-ink">Nhà của tôi <span className="font-normal text-muted">({houses.length})</span></div>
          <div className="space-y-1">{houses.map((house) => <button key={house.id} type="button" aria-current={selectedHouse.id === house.id ? 'true' : undefined} onClick={() => { setHouseChoice(house.id); setFloorChoice(''); }} className={cn('w-full rounded-xl px-3 py-3 text-left focus-visible:outline-2 focus-visible:outline-primary', selectedHouse.id === house.id ? 'bg-primary-soft text-primary-dark' : 'hover:bg-page')}><span className="block truncate text-sm font-semibold">{house.name}</span><span className="mt-1 block text-xs text-muted">{house.floors.reduce((sum, floor) => sum + floor.rooms.length, 0)} phòng · {house.floors.length} tầng</span></button>)}</div>
        </section>
        <section aria-label={`Phòng tại ${selectedHouse.name}`} className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4"><div><h2 className="text-xl font-bold text-ink">{selectedHouse.name}</h2><p className="mt-1 text-sm text-muted">{selectedHouse.address}</p></div><Link href="/landlord/listings" className="text-sm font-semibold text-primary hover:underline">Quản lý tin đăng</Link></div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc theo tầng"><button type="button" aria-pressed={!selectedFloor} onClick={() => setFloorChoice('')} className={cn('rounded-lg px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-primary', !selectedFloor ? 'bg-primary text-white' : 'border border-line bg-white text-muted hover:text-ink')}>Tất cả tầng</button>{selectedHouse.floors.map((floor) => <button key={floor.id} type="button" aria-pressed={selectedFloor?.id === floor.id} onClick={() => setFloorChoice(floor.id)} className={cn('rounded-lg px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-primary', selectedFloor?.id === floor.id ? 'bg-primary text-white' : 'border border-line bg-white text-muted hover:text-ink')}>{floor.name} <span className="font-normal opacity-75">({floor.rooms.length})</span></button>)}</div>
          {visibleFloors.map((floor) => <FloorRooms key={floor.id} floor={floor} />)}
        </section>
      </div>}
    </>}
  </div>;
}

function FloorRooms({ floor }: { floor: Floor }) {
  const sortedRooms = [...floor.rooms].sort((a, b) => a.detail.roomNumber.localeCompare(b.detail.roomNumber, 'vi', { numeric: true }));
  return <section aria-label={floor.name} className="space-y-3">
    <div className="flex items-baseline justify-between">
      <h3 className="text-base font-bold">{floor.name}</h3>
      <span className="text-xs text-muted">{floor.rooms.length} phòng</span>
    </div>
    {sortedRooms.length ? <div className="grid gap-3 sm:grid-cols-2">
      {sortedRooms.map((room) => <RoomCard key={room.detail.roomId} room={room} />)}
    </div> : <p className="rounded-xl border border-dashed border-line bg-page p-5 text-sm text-muted">Tầng này chưa có phòng.</p>}
  </section>;
}

function RoomCard({ room }: { room: CatalogRoom }) {
  const editable = room.postStatus === 'DRAFT' || room.postStatus === 'REJECTED';
  return <article className="min-w-0 rounded-2xl border border-line bg-white p-4">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs text-muted">Phòng</p>
        <h4 className="truncate text-lg font-bold text-ink">{room.detail.roomNumber}</h4>
      </div>
      <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', statusClass[room.roomStatus])}>
        {roomStatusLabel[room.roomStatus]}
      </span>
    </div>
    <p className="mt-3 line-clamp-2 text-sm font-medium text-ink">{room.detail.title}</p>
    <p className="mt-2 text-xs text-muted">{room.detail.area} m² · {formatVND(room.detail.rentalPrice)}/tháng</p>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs">
      <span className="text-muted">Tin đăng: {postStatusLabel[room.postStatus]}</span>
      {editable ? <Link href={`/landlord/listings/create?roomId=${room.detail.roomId}`} className="font-semibold text-primary hover:underline">Sửa phòng & tin nháp</Link>
        : <Link href="/landlord/listings" className="font-semibold text-primary hover:underline">Xem tin đăng</Link>}
    </div>
  </article>;
}
