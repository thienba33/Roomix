'use client';
import { useMemo, useState } from 'react';
import { landlordRooms, rooms } from '@/lib/data';
import { useTenanciesState, useRoomStatusesState, type LTenancy } from '@/lib/landlord-store';
import { cn, formatPriceShort, formatVND } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

const statusText: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Chờ cọc', className: 'text-[#B45309]' },
  ACTIVE: { label: 'Đang thuê', className: 'text-[#15803D]' },
  ENDING: { label: 'Sắp hết hạn', className: 'text-[#B45309]' },
  ENDED: { label: 'Đã kết thúc', className: 'text-[#6A6A6A]' },
  CANCELLED: { label: 'Đã hủy', className: 'text-[#6A6A6A]' },
};
const contractStatusLabel: Record<string, string> = { PENDING: 'Chờ xác nhận cọc', ACTIVE: 'Đang hiệu lực', ENDING: 'Sắp kết thúc', ENDED: 'Đã kết thúc', CANCELLED: 'Đã hủy' };
function houseOf(roomLabel: string): string { const code = roomLabel.replace('Phòng', '').trim(); return rooms.find((r) => r.code === code)?.house ?? 'Roomix Lê Văn Lương'; }

export default function KhachThuePage() {
  const toast = useToast();
  const [tenancies, setTenancies] = useTenanciesState();
  const [overrides, setOverrides] = useRoomStatusesState();
  const [selectedId, setSelectedId] = useState(1);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignRoomId, setAssignRoomId] = useState<number | null>(null);
  const [assignConfirm, setAssignConfirm] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);
  const [settleConfirm, setSettleConfirm] = useState(false);
  const [depositConfirmId, setDepositConfirmId] = useState<number | null>(null);

  const selected = tenancies.find((t) => t.id === selectedId) ?? tenancies[0];
  const availableRooms = useMemo(() => landlordRooms.map((r) => ({ ...r, status: overrides[String(r.id)] ?? r.status })).filter((r) => r.status === 'AVAILABLE'), [overrides]);
  const activeCount = tenancies.filter((t) => t.status === 'ACTIVE' || t.status === 'ENDING').length;

  if (!selected) return <p className="text-sm text-muted">Chưa có khách thuê.</p>;
  const fields = [
    { label: 'GIÁ THUÊ', value: `${formatPriceShort(selected.monthlyRent)} / tháng` },
    { label: 'ĐẶT CỌC', value: `${formatPriceShort(selected.deposit)} · ${selected.depositConfirmed ? 'Đã xác nhận' : 'Chưa xác nhận'}` },
    { label: 'ĐIỆN', value: `${selected.elecUnitPrice.toLocaleString('vi-VN')}đ / kWh` },
    { label: 'NƯỚC', value: `${selected.waterUnitPrice.toLocaleString('vi-VN')}đ / khối` },
    { label: 'CHU KỲ', value: selected.cycle },
    { label: 'TRẠNG THÁI', value: contractStatusLabel[selected.status] },
  ];

  // Settlement mock computation
  const settle = (() => {
    const finalElecUsage = 42; const finalWaterUsage = 4;
    const elecAmt = finalElecUsage * selected.elecUnitPrice; const waterAmt = finalWaterUsage * selected.waterUnitPrice;
    const damage = 0; const totalDue = elecAmt + waterAmt + damage; const refund = selected.deposit - totalDue;
    return { finalElecUsage, finalWaterUsage, elecAmt, waterAmt, damage, totalDue, refund };
  })();

  const doAssign = () => {
    if (!assignRoomId) return;
    const room = availableRooms.find((r) => r.id === assignRoomId); if (!room) return;
    const prevT = tenancies; const prevO = overrides; const tid = selected.id;
    setTenancies((list) => list.map((t) => (t.id === tid ? { ...t, room: `Phòng ${room.code}`, roomCode: room.code, monthlyRent: room.price } : t)));
    setOverrides((o) => ({ ...o, [String(room.id)]: 'OCCUPIED' }));
    setAssignConfirm(false); setAssignOpen(false);
    toast.push(`Đã phân Phòng ${room.code} cho ${selected.name}`, undefined, { label: 'Hoàn tác', onClick: () => { setTenancies(prevT); setOverrides(prevO); } });
  };
  const doSettle = () => {
    const prevT = tenancies; const prevO = overrides; const tid = selected.id; const code = selected.roomCode;
    const roomObj = landlordRooms.find((r) => r.code === code);
    setTenancies((list) => list.map((t) => (t.id === tid ? { ...t, status: 'ENDED' as LTenancy['status'] } : t)));
    if (roomObj) setOverrides((o) => ({ ...o, [String(roomObj.id)]: 'AVAILABLE' }));
    setSettleConfirm(false); setSettleOpen(false);
    toast.push('Đã tất toán & trả phòng', `Hoàn cọc ${formatVND(settle.refund)} · Phòng ${code} đã trống`, { label: 'Hoàn tác', onClick: () => { setTenancies(prevT); setOverrides(prevO); } });
  };
  const doConfirmDeposit = () => {
    if (depositConfirmId === null) return; const prev = tenancies; const id = depositConfirmId;
    setTenancies((list) => list.map((t) => (t.id === id ? { ...t, depositConfirmed: true, status: t.status === 'PENDING' ? ('ACTIVE' as const) : t.status } : t)));
    setDepositConfirmId(null);
    toast.push('Đã xác nhận tiền cọc', undefined, { label: 'Hoàn tác', onClick: () => setTenancies(prev) });
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold text-ink">Khách thuê &amp; Hợp đồng</h1><p className="mt-1 text-sm text-muted">{activeCount} khách đang thuê · {tenancies.filter((t) => t.status === 'PENDING').length} chờ cọc</p></div>
      <Card className="overflow-hidden p-0">
        <div className="px-5 pt-4"><p className="text-[11px] font-semibold uppercase tracking-wider text-muted">KHÁCH</p></div>
        <div className="mt-2 divide-y divide-line">
          {tenancies.map((t) => { const st = statusText[t.status]; const isSelected = t.id === selected.id; return (
            <button key={t.id} type="button" onClick={() => setSelectedId(t.id)} className={cn('flex w-full items-center gap-3.5 px-5 py-3.5 text-left', isSelected && 'bg-primary-soft/40')}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[13px] font-bold text-primary">{t.initials ?? 'KH'}</span>
              <span className="min-w-0 flex-1"><span className="block font-semibold text-ink">{t.name}</span><span className="mt-0.5 block text-sm text-muted">{t.room} · {houseOf(t.room)}</span></span>
              <span className={cn('shrink-0 text-[13px] font-semibold', st.className)}>{st.label}</span>
            </button> ); })}
        </div>
      </Card>
      <Card className="p-6">
        <h2 className="text-[17px] font-semibold text-ink">Hợp đồng #HD-{selected.roomCode} · {selected.name}</h2>
        <p className="mt-1 text-[13px] text-muted">{selected.startDate}{selected.endDate ? ` → ${selected.endDate}` : ''} · {selected.phone} · {selected.email}</p>
        <div className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">{fields.map((f) => (<div key={f.label}><p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{f.label}</p><p className="mt-1 font-medium text-ink">{f.value}</p></div>))}</div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={() => { setAssignRoomId(availableRooms[0]?.id ?? null); setAssignOpen(true); }}>Phân phòng</Button>
          <Button type="button" variant="outline" onClick={() => setSettleOpen(true)}>Trả phòng / Tất toán</Button>
          {selected.status === 'PENDING' && !selected.depositConfirmed && <Button type="button" onClick={() => setDepositConfirmId(selected.id)}>Xác nhận đã nhận cọc</Button>}
        </div>
        <p className="mt-3 text-[12px] text-muted">Phân phòng dành cho khách đã có hợp đồng. Với khách mới, hãy xử lý trong mục Yêu cầu.</p>
      </Card>

      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title={`Phân phòng cho ${selected.name}`} widthClass="max-w-lg">
        <p className="mb-4 text-sm text-muted">Chọn một phòng đang trống. Sau khi xác nhận, phòng sẽ chuyển sang Đang thuê.</p>
        {availableRooms.length === 0 ? <p className="text-sm text-muted">Hiện không có phòng trống.</p> : (
          <div className="grid grid-cols-3 gap-2">{availableRooms.slice(0, 12).map((r) => (<button key={r.id} type="button" onClick={() => setAssignRoomId(r.id)} className={cn('rounded-xl border px-3 py-3 text-left', assignRoomId === r.id ? 'border-primary bg-primary-soft/50' : 'border-line')}><span className="block font-bold text-ink">{r.code}</span><span className="text-[12px] text-muted">{formatPriceShort(r.price)}/th · T{r.floor}</span></button>))}</div>
        )}
        <div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={() => setAssignOpen(false)}>Hủy</Button><Button disabled={!assignRoomId} onClick={() => setAssignConfirm(true)}>Tiếp tục</Button></div>
      </Modal>
      <ConfirmDialog open={assignConfirm} title="Xác nhận phân phòng" description={assignRoomId ? `Gán ${selected.name} vào Phòng ${availableRooms.find((r) => r.id === assignRoomId)?.code}. Phòng sẽ chuyển sang trạng thái Đang thuê.` : ''} confirmLabel="Xác nhận phân phòng" onConfirm={doAssign} onCancel={() => setAssignConfirm(false)} />

      <Modal open={settleOpen} onClose={() => setSettleOpen(false)} title={`Tất toán · ${selected.name} · ${selected.room}`} widthClass="max-w-lg">
        <p className="mb-4 text-sm text-muted">Xem trước tất toán · Chỉ số cuối kỳ là dữ liệu minh họa.</p>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between"><span>Điện cuối kỳ · {settle.finalElecUsage} số × {selected.elecUnitPrice.toLocaleString('vi-VN')}đ</span><span className="font-semibold">{formatVND(settle.elecAmt)}</span></div>
          <div className="flex justify-between"><span>Nước cuối kỳ · {settle.finalWaterUsage} khối × {selected.waterUnitPrice.toLocaleString('vi-VN')}đ</span><span className="font-semibold">{formatVND(settle.waterAmt)}</span></div>
          <div className="flex justify-between"><span>Khấu trừ hư hỏng</span><span className="font-semibold">{formatVND(settle.damage)}</span></div>
          <div className="flex justify-between border-t border-line pt-2"><span>Tổng khấu trừ</span><span className="font-semibold">{formatVND(settle.totalDue)}</span></div>
          <div className="flex justify-between"><span>Tiền cọc đã giữ</span><span className="font-semibold">{formatVND(selected.deposit)}</span></div>
          <div className="flex justify-between text-base font-bold"><span>Hoàn lại cho khách</span><span className="text-primary">{formatVND(settle.refund)}</span></div>
        </div>
        <div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={() => setSettleOpen(false)}>Đóng</Button><Button onClick={() => setSettleConfirm(true)}>Hoàn tất trả phòng</Button></div>
      </Modal>
      <ConfirmDialog open={settleConfirm} title="Hoàn tất trả phòng?" description={`Hợp đồng của ${selected.name} sẽ kết thúc, ${selected.room} sẽ trở về trạng thái Còn trống và số tiền hoàn cọc ${formatVND(settle.refund)} được ghi nhận. Bạn có thể hoàn tác ngay sau đó qua toast.`} confirmLabel="Hoàn tất tất toán" danger onConfirm={doSettle} onCancel={() => setSettleConfirm(false)} />
      <ConfirmDialog open={depositConfirmId !== null} title="Xác nhận đã nhận cọc?" description="Đánh dấu đã nhận đủ tiền cọc. Hợp đồng đang chờ cọc sẽ chuyển sang Đang hiệu lực (ACTIVE)." confirmLabel="Đã nhận cọc" onConfirm={doConfirmDeposit} onCancel={() => setDepositConfirmId(null)} />
    </div>
  );
}
