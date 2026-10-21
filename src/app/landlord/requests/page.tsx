'use client';
import { useState } from 'react';
import Image from 'next/image';
import { rooms } from '@/lib/data';
import { useRequestsState, useTenanciesState, useRoomStatusesState, nextId, type LRequest } from '@/lib/landlord-store';
import type { RequestStatus } from '@/types';
import { cn, formatPriceShort, formatVND } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import RejectModal from '@/components/layouts/RejectModal';
import { useToast } from '@/components/ui/Toast';

const statusLabel: Record<RequestStatus, string> = { PENDING: 'Chờ xử lý', ACCEPTED: 'Đã chấp nhận', REJECTED: 'Đã từ chối' };
const statusTone: Record<RequestStatus, 'amber' | 'green' | 'red'> = { PENDING: 'amber', ACCEPTED: 'green', REJECTED: 'red' };
function roomOf(req: LRequest) { return rooms.find((r) => r.id === req.roomId); }

interface Terms { rent: string; deposit: string; startDate: string; cycle: string; elecPrice: string; waterPrice: string; depositDeadline: string; }

export default function YeuCauPage() {
  const toast = useToast();
  const [items, setItems] = useRequestsState();
  const [tenancies, setTenancies] = useTenanciesState();
  const [, setRoomStatuses] = useRoomStatusesState();
  const [selectedId, setSelectedId] = useState<number>(1);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [acceptId, setAcceptId] = useState<number | null>(null);
  const [terms, setTerms] = useState<Terms>({ rent: '', deposit: '', startDate: '2026-11-01', cycle: 'Hàng tháng · đầu tháng', elecPrice: '3500', waterPrice: '12000', depositDeadline: '2026-10-28' });
  const [errors, setErrors] = useState<Partial<Record<keyof Terms, string>>>({});

  const pendingCount = items.filter((i) => i.status === 'PENDING').length;
  const selected = items.find((i) => i.id === selectedId) ?? items[0];
  const rejectTarget = items.find((i) => i.id === rejectId);
  const acceptTarget = items.find((i) => i.id === acceptId);

  const openAccept = (req: LRequest) => {
    const room = roomOf(req);
    setTerms({ rent: String(room?.price ?? 2800000), deposit: String(room?.price ?? 2800000), startDate: '2026-11-01', cycle: 'Hàng tháng · đầu tháng', elecPrice: '3500', waterPrice: '12000', depositDeadline: '2026-10-28' });
    setErrors({});
    setAcceptId(req.id);
  };

  const validateTerms = (): boolean => {
    const e: Partial<Record<keyof Terms, string>> = {};
    if (!terms.rent || Number(terms.rent) <= 0) e.rent = 'Nhập tiền thuê > 0';
    if (!terms.deposit || Number(terms.deposit) < 0) e.deposit = 'Nhập tiền cọc hợp lệ';
    if (!terms.startDate) e.startDate = 'Chọn ngày bắt đầu';
    if (!terms.cycle.trim()) e.cycle = 'Nhập chu kỳ thanh toán';
    if (!terms.elecPrice || Number(terms.elecPrice) <= 0) e.elecPrice = 'Nhập đơn giá điện > 0';
    if (!terms.waterPrice || Number(terms.waterPrice) <= 0) e.waterPrice = 'Nhập đơn giá nước > 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const confirmAccept = () => {
    if (!acceptTarget || !validateTerms()) return;
    const req = acceptTarget;
    const prevItems = items; const prevTenancies = tenancies;
    const room = roomOf(req);
    const code = req.room.replace('Phòng', '').trim();
    const newTenancy = {
      id: nextId(tenancies), name: req.tenant, initials: req.initials, room: req.room, roomCode: code,
      phone: req.phone ?? '—', email: req.email ?? '—',
      startDate: terms.startDate.split('-').reverse().join('/'), deposit: Number(terms.deposit), monthlyRent: Number(terms.rent),
      status: 'PENDING' as const, depositConfirmed: false, elecUnitPrice: Number(terms.elecPrice), waterUnitPrice: Number(terms.waterPrice), cycle: terms.cycle, sourceRequestId: req.id,
    };
    setItems((prev) => prev.map((i) => (i.id === req.id ? { ...i, status: 'ACCEPTED' as RequestStatus } : i)));
    setTenancies((prev) => [...prev, newTenancy]);
    if (room) setRoomStatuses((o) => ({ ...o, [String(room.id)]: 'RESERVED' }));
    setAcceptId(null);
    toast.push('Đã chấp nhận — Contact Card đã được gửi', `Đã tạo hợp đồng chờ cọc cho ${req.tenant} · ${req.room}`, {
      label: 'Hoàn tác', onClick: () => { setItems(prevItems); setTenancies(prevTenancies); },
    });
    void prevItems; void prevTenancies;
  };

  const handleReject = (reason: string) => {
    if (rejectId === null) return;
    const id = rejectId; const prev = items;
    setItems((p) => p.map((i) => (i.id === id ? { ...i, status: 'REJECTED' as RequestStatus, rejectReason: reason } : i)));
    toast.push('Đã từ chối yêu cầu', reason, { label: 'Hoàn tác', onClick: () => setItems(prev) });
  };

  const field = (label: string, key: keyof Terms, type = 'text', suffix?: string) => (
    <div>
      <label className="mb-1.5 block text-[13px] font-semibold text-ink">{label} <span className="text-red-600">*</span></label>
      <div className="flex items-center gap-2">
        <input type={type} value={terms[key]} onChange={(e) => setTerms((t) => ({ ...t, [key]: e.target.value }))} className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
        {suffix && <span className="shrink-0 text-sm text-muted">{suffix}</span>}
      </div>
      {terms[key] && key !== 'cycle' && key !== 'startDate' && key !== 'depositDeadline' && !isNaN(Number(terms[key])) && Number(terms[key]) > 0 && <p className="mt-1 text-[12px] text-muted">{formatVND(Number(terms[key]))}</p>}
      {errors[key] && <p className="mt-1 text-[13px] font-medium text-red-600" role="alert">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="space-y-5">
      <div><h1 className="text-[28px] font-extrabold text-ink">Yêu cầu quan tâm</h1><p className="mt-1 text-sm text-muted">{pendingCount} yêu cầu đang chờ xử lý</p></div>
      <div className="grid items-start gap-5 lg:grid-cols-[1.8fr_1fr]">
        <Card className="overflow-hidden p-0"><div className="divide-y divide-line/70">
          {items.map((req) => { const room = roomOf(req); return (
            <button key={req.id} onClick={() => setSelectedId(req.id)} className={cn('flex w-full items-center gap-3.5 px-5 py-4 text-left transition hover:bg-page/60', selected?.id === req.id && 'bg-primary-soft/40')}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">{req.initials ?? 'KH'}</span>
              <span className="min-w-0 flex-1"><span className="block truncate font-semibold text-ink">{req.tenant}</span><span className="mt-0.5 block truncate text-sm text-muted">{req.room}{room ? ` · ${room.area}` : ''}</span><span className="mt-0.5 block text-[13px] text-muted">{req.date}</span></span>
              <Badge tone={statusTone[req.status]} dot className="hidden shrink-0 sm:inline-flex">{statusLabel[req.status]}</Badge>
              {room && <Image src={room.image} alt={req.room} width={112} height={112} className="hidden h-14 w-14 shrink-0 rounded-lg object-cover md:block" />}
            </button> ); })}
        </div></Card>
        {selected && (
          <Card className="p-5">
            <h2 className="text-[17px] font-bold text-ink">Chi tiết yêu cầu</h2>
            <p className="mt-5 text-[13px] text-muted">Khách thuê</p><p className="mt-1 font-bold text-ink">{selected.tenant}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">SĐT và Zalo sẽ gửi kèm Contact Card sau khi bạn chấp nhận.</p>
            <p className="mt-5 text-[13px] text-muted">Phòng quan tâm</p>
            <p className="mt-1 font-semibold text-ink">{selected.room}{roomOf(selected) ? ` — ${formatPriceShort(roomOf(selected)!.price)} / tháng` : ''}</p>
            <div className="mt-5 rounded-xl bg-page px-4 py-3"><p className="text-sm leading-relaxed text-ink">&ldquo;{selected.message}&rdquo;</p></div>
            {selected.status === 'PENDING' && (<div className="mt-6 space-y-2.5"><Button size="lg" className="w-full" onClick={() => openAccept(selected)}>Chấp nhận &amp; gửi Contact Card</Button><Button size="lg" variant="outline" className="w-full" onClick={() => setRejectId(selected.id)}>Từ chối</Button></div>)}
            {selected.status === 'ACCEPTED' && (<div className="mt-6"><p className="flex items-center gap-1.5 text-sm font-medium text-green-700"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>Đã gửi Contact Card</p><p className="mt-2 text-[13px] text-muted">Hợp đồng đã tạo ở mục Khách thuê (trạng thái chờ cọc).</p></div>)}
            {selected.status === 'REJECTED' && (<div className="mt-6"><p className="text-sm text-muted">Đã từ chối yêu cầu này</p>{selected.rejectReason && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">Lý do: {selected.rejectReason}</p>}</div>)}
          </Card>
        )}
      </div>

      <Modal open={acceptId !== null} onClose={() => setAcceptId(null)} title="Điều khoản hợp đồng" widthClass="max-w-xl">
        <p className="-mt-2 mb-5 text-sm text-muted">{acceptTarget ? `${acceptTarget.tenant} · ${acceptTarget.room} — điền các trường có dấu * để tiếp tục.` : ''}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {field('Tiền thuê / tháng', 'rent', 'number')}
          {field('Tiền đặt cọc', 'deposit', 'number')}
          {field('Ngày bắt đầu', 'startDate', 'date')}
          {field('Hạn đặt cọc', 'depositDeadline', 'date')}
          {field('Đơn giá điện (đ/kWh)', 'elecPrice', 'number')}
          {field('Đơn giá nước (đ/khối)', 'waterPrice', 'number')}
        </div>
        <div className="mt-4">
          <label className="mb-1.5 block text-[13px] font-semibold text-ink">Chu kỳ thanh toán <span className="text-red-600">*</span></label>
          <select value={terms.cycle} onChange={(e) => setTerms((t) => ({ ...t, cycle: e.target.value }))} className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
            <option>Hàng tháng · đầu tháng</option><option>Hàng tháng · cuối tháng</option><option>3 tháng / lần</option>
          </select>
          {errors.cycle && <p className="mt-1 text-[13px] text-red-600">{errors.cycle}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={() => setAcceptId(null)}>Hủy</Button><Button onClick={confirmAccept}>Xác nhận chấp nhận</Button></div>
      </Modal>

      <RejectModal open={rejectId !== null} onClose={() => setRejectId(null)} tenantName={rejectTarget?.tenant} roomLabel={rejectTarget?.room} onConfirm={(reason) => handleReject(reason)} />
    </div>
  );
}
