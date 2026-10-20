'use client';
import { useMemo, useState } from 'react';
import { house, landlordRooms } from '@/lib/data';
import { useRoomStatusesState } from '@/lib/landlord-store';
import { cn, formatPriceShort, roomStatusLabel, roomStatusTone } from '@/lib/utils';
import type { RoomStatus } from '@/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

const statusBg: Record<RoomStatus, string> = { AVAILABLE: 'bg-white', OCCUPIED: 'bg-[#F7F7F7]', RESERVED: 'bg-[#FEF3C7]', MAINTENANCE: 'bg-[#FEE2E2]' };
const statusText: Record<RoomStatus, string> = { AVAILABLE: 'text-[#15803D]', OCCUPIED: 'text-[#6A6A6A]', RESERVED: 'text-[#B45309]', MAINTENANCE: 'text-[#B91C1C]' };
const ALL_STATUSES: RoomStatus[] = ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'];
const consequence: Record<RoomStatus, string> = {
  AVAILABLE: 'Phòng sẽ hiển thị là còn trống và có thể nhận yêu cầu thuê mới.',
  OCCUPIED: 'Phòng sẽ được đánh dấu đang thuê. Trạng thái này thường đi kèm hợp đồng/tenancy — hãy chắc chắn đã có khách thuê thực tế.',
  RESERVED: 'Phòng sẽ được giữ chỗ, không nhận yêu cầu mới cho đến khi bạn đổi trạng thái.',
  MAINTENANCE: 'Phòng sẽ tạm ngừng cho thuê để bảo trì/sửa chữa.',
};

export default function PhongPage() {
  const toast = useToast();
  const [overrides, setOverrides] = useRoomStatusesState();
  const [selectedFloor, setSelectedFloor] = useState<number>(3);
  const [selectedRoomId, setSelectedRoomId] = useState<number>(306);
  const [search, setSearch] = useState('');
  const [pendingStatus, setPendingStatus] = useState<RoomStatus | null>(null);

  const roomsState = useMemo(() => landlordRooms.map((r) => ({ ...r, status: overrides[String(r.id)] ?? r.status })), [overrides]);
  const floorCounts = useMemo(() => {
    const m = new Map<number, { total: number; avail: number }>();
    roomsState.forEach((r) => { const cur = m.get(r.floor) ?? { total: 0, avail: 0 }; cur.total++; if (r.status === 'AVAILABLE') cur.avail++; m.set(r.floor, cur); });
    return m;
  }, [roomsState]);

  const floorRooms = roomsState.filter((r) => r.floor === selectedFloor).filter((r) => !search.trim() || r.code.includes(search.trim())).sort((a, b) => a.id - b.id);
  const selectedRoom = roomsState.find((r) => r.id === selectedRoomId) ?? floorRooms[0] ?? roomsState[0];

  const handleSelectFloor = (floor: number) => { setSelectedFloor(floor); const first = roomsState.filter((r) => r.floor === floor).sort((a, b) => a.id - b.id)[0]; if (first) setSelectedRoomId(first.id); };

  const confirmStatusChange = () => {
    if (!selectedRoom || !pendingStatus) return;
    const prev = selectedRoom.status;
    const roomId = selectedRoom.id; const next = pendingStatus;
    setOverrides((o) => ({ ...o, [String(roomId)]: next }));
    setPendingStatus(null);
    toast.push(`Đã đổi Phòng ${selectedRoom.code} sang ${roomStatusLabel[next]}`, undefined, { label: 'Hoàn tác', onClick: () => setOverrides((o) => ({ ...o, [String(roomId)]: prev })) });
  };

  return (
    <div>
      <div><h1 className="text-2xl font-semibold text-ink">Nhà &amp; Phòng</h1><p className="mt-1 text-[13px] text-muted">{`${house.name} · 4 tầng · ${landlordRooms.length} phòng`}</p></div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((floor) => { const c = floorCounts.get(floor); return (
            <button key={floor} type="button" onClick={() => handleSelectFloor(floor)} className={cn('h-7 rounded-full px-3 text-xs font-medium', selectedFloor === floor ? 'bg-primary-soft text-primary' : 'bg-[#F7F7F7] text-muted hover:text-ink')}>
              Tầng {floor}{c ? ` · ${c.avail}/${c.total} trống` : ''}
            </button> ); })}
        </div>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo mã phòng… (vd 302)" aria-label="Tìm phòng theo mã" className="h-9 w-56 rounded-full border border-line px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
        {search && <span className="text-[13px] text-muted">Hiển thị {floorRooms.length} phòng</span>}
      </div>
      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[1fr_324px]">
        <div className="grid grid-cols-2 gap-6 xl:grid-cols-4">
          {floorRooms.length === 0 && <p className="col-span-full py-8 text-sm text-muted">Không tìm thấy phòng nào khớp mã &quot;{search}&quot; ở tầng {selectedFloor}.</p>}
          {floorRooms.map((room) => { const isSelected = selectedRoom?.id === room.id; return (
            <button key={room.id} type="button" onClick={() => setSelectedRoomId(room.id)} className={cn('h-[126px] rounded-xl border border-line p-4 text-left', statusBg[room.status], isSelected && 'border-primary ring-1 ring-primary/40')}>
              <span className="block text-xl font-bold text-ink">{room.code}</span>
              <span className={cn('mt-1 block text-[13px] font-semibold', statusText[room.status])}>{roomStatusLabel[room.status]}</span>
              <span className="mt-2 block text-[12.5px] text-muted">{formatPriceShort(room.price)} / tháng</span>
            </button> ); })}
        </div>
        {selectedRoom && (
          <div className="min-h-[276px] rounded-2xl border border-line bg-white p-5">
            <div className="flex items-start justify-between gap-3"><h2 className="text-[17px] font-semibold text-ink">Phòng {selectedRoom.code}</h2><Badge tone={roomStatusTone[selectedRoom.status]}>{roomStatusLabel[selectedRoom.status]}</Badge></div>
            <div className="mt-4 space-y-2.5 text-[13px] text-muted"><p>Giá thuê · {formatPriceShort(selectedRoom.price)} / tháng</p><p>Diện tích · {selectedRoom.size} m²</p><p>Tầng · Tầng {selectedRoom.floor}</p>{selectedRoom.note && <p>Ghi chú · {selectedRoom.note}</p>}</div>
            <p className="mt-5 text-[13px] font-semibold text-ink">Đổi trạng thái sang:</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {ALL_STATUSES.filter((s) => s !== selectedRoom.status).map((s) => (<Button key={s} variant="outline" size="sm" onClick={() => setPendingStatus(s)}>{roomStatusLabel[s]}</Button>))}
            </div>
            <p className="mt-3 text-[12px] text-muted">Mỗi lần đổi đều cần xác nhận và có thể hoàn tác qua toast.</p>
          </div>
        )}
      </div>
      <ConfirmDialog open={pendingStatus !== null && !!selectedRoom} title={`Đổi trạng thái Phòng ${selectedRoom?.code ?? ''}`} description={pendingStatus ? `Chuyển sang "${roomStatusLabel[pendingStatus]}". ${consequence[pendingStatus]}` : ''} confirmLabel="Xác nhận đổi" onConfirm={confirmStatusChange} onCancel={() => setPendingStatus(null)} />
    </div>
  );
}
