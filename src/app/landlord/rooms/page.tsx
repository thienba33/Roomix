'use client';

import { useState } from 'react';
import { house, landlordRooms } from '@/lib/data';
import { cn, formatPriceShort, roomStatusLabel, roomStatusTone } from '@/lib/utils';
import type { Room, RoomStatus } from '@/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

const statusBg: Record<RoomStatus, string> = {
  AVAILABLE: 'bg-white',
  OCCUPIED: 'bg-[#F7F7F7]',
  RESERVED: 'bg-[#FEF3C7]',
  MAINTENANCE: 'bg-[#FEE2E2]',
};

const statusText: Record<RoomStatus, string> = {
  AVAILABLE: 'text-[#15803D]',
  OCCUPIED: 'text-[#6A6A6A]',
  RESERVED: 'text-[#B45309]',
  MAINTENANCE: 'text-[#B91C1C]',
};

const statusCycle: RoomStatus[] = ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'];

export default function PhongPage() {
  const [roomsState, setRoomsState] = useState<Room[]>(landlordRooms);
  const [selectedFloor, setSelectedFloor] = useState<number>(3);
  const [selectedRoomId, setSelectedRoomId] = useState<number>(306);

  const floorRooms = roomsState
    .filter((r) => r.floor === selectedFloor)
    .sort((a, b) => a.id - b.id);

  const selectedRoom = roomsState.find((r) => r.id === selectedRoomId) ?? floorRooms[0] ?? roomsState[0];

  const handleSelectFloor = (floor: number) => {
    if (floor === selectedFloor) return;
    setSelectedFloor(floor);
    const first = roomsState.filter((r) => r.floor === floor).sort((a, b) => a.id - b.id)[0];
    if (first) setSelectedRoomId(first.id);
  };

  const handleCycleStatus = () => {
    if (!selectedRoom) return;
    const currentIndex = statusCycle.indexOf(selectedRoom.status);
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
    setRoomsState((prev) =>
      prev.map((r) => (r.id === selectedRoom.id ? { ...r, status: nextStatus } : r)),
    );
  };

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold text-ink">Nhà &amp; Phòng</h1>
        <p className="mt-1 text-[13px] text-muted">{`${house.name} · 4 tầng · ${landlordRooms.length} phòng`}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {[1, 2, 3, 4].map((floor) => (
          <button
            key={floor}
            type="button"
            onClick={() => handleSelectFloor(floor)}
            className={cn(
              'h-7 rounded-full px-3 text-xs font-medium',
              selectedFloor === floor
                ? 'bg-primary-soft text-primary'
                : 'bg-[#F7F7F7] text-muted hover:text-ink',
            )}
          >
            Tầng {floor}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_324px] items-start">
        <div className="grid grid-cols-2 gap-6 xl:grid-cols-4">
          {floorRooms.map((room) => {
            const isSelected = selectedRoom?.id === room.id;
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => setSelectedRoomId(room.id)}
                className={cn(
                  'h-[126px] rounded-xl border border-line p-4 text-left',
                  statusBg[room.status],
                  isSelected && 'ring-1 ring-primary/40 border-primary',
                )}
              >
                <span className="block text-xl font-bold text-ink">{room.code}</span>
                <span className={cn('mt-1 block text-[13px] font-semibold', statusText[room.status])}>
                  {roomStatusLabel[room.status]}
                </span>
                <span className="mt-2 block text-[12.5px] text-muted">
                  {formatPriceShort(room.price)} / tháng
                </span>
              </button>
            );
          })}
        </div>

        {selectedRoom && (
          <div className="min-h-[276px] rounded-2xl border border-line bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-[17px] font-semibold text-ink">Phòng {selectedRoom.code}</h2>
              <Badge tone={roomStatusTone[selectedRoom.status]}>{roomStatusLabel[selectedRoom.status]}</Badge>
            </div>
            <div className="mt-4 space-y-2.5 text-[13px] text-muted">
              <p>Giá thuê · {formatPriceShort(selectedRoom.price)} / tháng</p>
              <p>Diện tích · {selectedRoom.size} m²</p>
              <p>Tầng · Tầng {selectedRoom.floor}</p>
              {selectedRoom.note && <p>Ghi chú · {selectedRoom.note}</p>}
            </div>
            <Button variant="outline" className="mt-5 w-[216px]" onClick={handleCycleStatus}>
              Đổi trạng thái
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
