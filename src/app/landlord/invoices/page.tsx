'use client';
import { useMemo, useState } from 'react';
import { useInvoicesState, useTenanciesState, isOverdue, nextId, todayVN, type LInvoice } from '@/lib/landlord-store';
import type { Invoice } from '@/types';
import { cn, formatVND } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import InvoiceDrawer from '@/components/layouts/InvoiceDrawer';
import { useToast } from '@/components/ui/Toast';

type Chip = 'CURRENT' | 'OVERDUE' | 'UNRECORDED' | 'ALL';
const CHIPS: { key: Chip; label: string }[] = [
  { key: 'CURRENT', label: 'Tháng 10/2026' }, { key: 'OVERDUE', label: 'Hóa đơn quá hạn' }, { key: 'UNRECORDED', label: 'Chưa ghi chỉ số' }, { key: 'ALL', label: 'Tất cả' },
];

interface MeterDraft { oldElec: string; newElec: string; oldWater: string; newWater: string; }
const PREV: Record<string, { elec: number; water: number; rent: number; tenant: string }> = {
  'Phòng 302': { elec: 1240, water: 41, rent: 2800000, tenant: 'Trần Minh Anh' },
  'Phòng 305': { elec: 980, water: 28, rent: 2600000, tenant: 'Khách 305' },
  'Phòng 308': { elec: 2010, water: 55, rent: 2600000, tenant: 'Phạm Thu Hằng' },
  'Phòng 405': { elec: 860, water: 33, rent: 3200000, tenant: 'Lê Hoàng Nam' },
};
const ELEC_PRICE = 3500; const WATER_PRICE = 12000; const SERVICE_FEE = 100000;
const METER_ROOMS = Object.keys(PREV);

export default function HoaDonPage() {
  const toast = useToast();
  const [invoices, setInvoices] = useInvoicesState();
  const [tenancies] = useTenanciesState();
  void tenancies;
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [open, setOpen] = useState(false);
  const [chip, setChip] = useState<Chip>('CURRENT');
  const [meterRoom, setMeterRoom] = useState('Phòng 405');
  const [draft, setDraft] = useState<MeterDraft>({ oldElec: String(PREV['Phòng 405'].elec), newElec: '', oldWater: String(PREV['Phòng 405'].water), newWater: '' });
  const [recordedRooms, setRecordedRooms] = useState<string[]>(['Phòng 302', 'Phòng 305', 'Phòng 308']);
  const [confirmAction, setConfirmAction] = useState<{ kind: 'confirm' | 'pay'; inv: LInvoice } | null>(null);

  const sorted = useMemo(() => [...invoices].sort((a, b) => Number(isOverdue(b)) - Number(isOverdue(a)) || a.id - b.id), [invoices]);
  const recent = chip === 'OVERDUE' ? sorted.filter((i) => isOverdue(i)) : chip === 'UNRECORDED' ? [] : sorted;
  const featured = sorted.find((i) => isOverdue(i)) ?? sorted[0];

  const prev = PREV[meterRoom];
  const elecUsage = draft.newElec === '' ? null : Number(draft.newElec) - Number(draft.oldElec || prev.elec);
  const waterUsage = draft.newWater === '' ? null : Number(draft.newWater) - Number(draft.oldWater || prev.water);
  const elecError = elecUsage !== null && (isNaN(elecUsage) || elecUsage < 0) ? 'Chỉ số điện mới phải ≥ chỉ số cũ' : '';
  const waterError = waterUsage !== null && (isNaN(waterUsage) || waterUsage < 0) ? 'Chỉ số nước mới phải ≥ chỉ số cũ' : '';
  const elecAmt = elecUsage && elecUsage > 0 ? elecUsage * ELEC_PRICE : 0;
  const waterAmt = waterUsage && waterUsage > 0 ? waterUsage * WATER_PRICE : 0;
  const canCreate = !elecError && !waterError && elecUsage !== null && waterUsage !== null && elecUsage >= 0 && waterUsage >= 0;
  const liveTotal = prev.rent + elecAmt + waterAmt + SERVICE_FEE;

  const pickRoom = (room: string) => { setMeterRoom(room); setDraft({ oldElec: String(PREV[room].elec), newElec: '', oldWater: String(PREV[room].water), newWater: '' }); };

  const createInvoice = () => {
    if (!canCreate) return;
    const codeSuffix = meterRoom.replace('Phòng ', '');
    const newInv: LInvoice = {
      id: nextId(invoices), code: `HD-${codeSuffix}-11`, room: meterRoom, tenant: prev.tenant, period: 'Tháng 11/2026', dueDate: '05/12/2026', status: 'PENDING',
      items: [
        { label: 'Tiền phòng', detail: 'Tháng 11/2026', amount: prev.rent },
        { label: 'Tiền điện', detail: `${elecUsage} số × ${ELEC_PRICE.toLocaleString('vi-VN')}đ`, amount: elecAmt },
        { label: 'Tiền nước', detail: `${waterUsage} khối × ${WATER_PRICE.toLocaleString('vi-VN')}đ`, amount: waterAmt },
        { label: 'Phí dịch vụ', detail: 'Vệ sinh, thang máy, rác (UC05.7 — chưa có InvoiceItemType ở backend)', amount: SERVICE_FEE },
      ],
      total: liveTotal, history: [], reminders: [],
    };
    const prevList = invoices;
    setInvoices((list) => [newInv, ...list]);
    if (!recordedRooms.includes(meterRoom)) setRecordedRooms((r) => [...r, meterRoom]);
    toast.push(`Đã tạo hóa đơn ${newInv.code}`, `${meterRoom} · ${formatVND(liveTotal)} · trạng thái Chờ thanh toán`, { label: 'Hoàn tác', onClick: () => setInvoices(prevList) });
    setSelected(newInv); setOpen(true);
  };

  const doConfirmAction = () => {
    if (!confirmAction) return;
    const { kind, inv } = confirmAction; const prevList = invoices;
    const nextStatus = kind === 'confirm' ? ('CONFIRMED' as const) : ('PAID' as const);
    setInvoices((list) => list.map((i) => (i.id === inv.id ? { ...i, status: nextStatus, history: kind === 'pay' ? [...i.history, { date: todayVN(), label: 'Thanh toán', amount: i.total }] : i.history } : i)));
    if (selected?.id === inv.id) setSelected({ ...inv, status: nextStatus });
    setConfirmAction(null);
    toast.push(kind === 'confirm' ? 'Đã xác nhận hóa đơn' : 'Đã ghi nhận thanh toán', `${inv.room} · ${inv.code}`, { label: 'Hoàn tác', onClick: () => setInvoices(prevList) });
  };

  const handleRemind = (inv: Invoice) => {
    const prevList = invoices;
    setInvoices((list) => list.map((i) => (i.id === inv.id ? { ...i, reminders: [...(i.reminders ?? []), { date: todayVN() }] } : i)));
    toast.push('Đã gửi nhắc thanh toán', `${inv.room} · ${inv.period} (InvoiceReminder đã ghi)`, { label: 'Hoàn tác', onClick: () => setInvoices(prevList) });
  };

  const openInvoice = (inv: Invoice) => { const full = invoices.find((i) => i.id === inv.id) ?? inv; setSelected(full as Invoice); setOpen(true); };
  const selectedFull = selected ? invoices.find((i) => i.id === selected.id) : null;

  const numField = (label: string, key: keyof MeterDraft, placeholder: string) => (
    <div><label className="mb-1 block text-[12px] font-semibold text-muted">{label}</label><input type="number" value={draft[key]} placeholder={placeholder} onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))} className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></div>
  );

  return (
    <div className="space-y-5">
      <div><h1 className="text-[28px] font-extrabold text-ink">Điện – Nước &amp; Hóa đơn</h1><p className="mt-1 text-sm text-muted">Kỳ tháng 10/2026 · Quá hạn được tính từ hạn thanh toán (không có trạng thái OVERDUE ở backend)</p></div>
      <div className="flex flex-wrap gap-2">{CHIPS.map((c) => (<button key={c.key} onClick={() => setChip(c.key)} className={cn('rounded-full px-4 py-2 text-sm transition', chip === c.key ? 'bg-primary-soft font-semibold text-primary-dark' : 'font-medium text-muted hover:bg-page hover:text-ink')}>{c.label}{c.key === 'OVERDUE' ? ` (${invoices.filter((i) => isOverdue(i)).length})` : ''}</button>))}</div>
      <div className="grid items-start gap-5 lg:grid-cols-[1.8fr_1fr]">
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="text-[17px] font-bold text-ink">Ghi chỉ số điện – nước · tháng 11</h2>
            <div className="mt-3 flex flex-wrap gap-2">{METER_ROOMS.map((r) => (<button key={r} onClick={() => pickRoom(r)} className={cn('rounded-full px-3 py-1.5 text-[13px]', meterRoom === r ? 'bg-primary-soft font-semibold text-primary' : 'bg-page text-muted')}>{r}{recordedRooms.includes(r) ? ' ✓' : ''}</button>))}</div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-line p-4"><p className="mb-3 text-sm font-bold text-ink">Điện (UC05.5) · {ELEC_PRICE.toLocaleString('vi-VN')}đ/số</p><div className="grid grid-cols-2 gap-3">{numField('Chỉ số cũ', 'oldElec', '')}{numField('Chỉ số mới *', 'newElec', 'Nhập chỉ số mới')}</div>{elecError && <p className="mt-2 text-[13px] font-medium text-red-600" role="alert">{elecError}</p>}{elecUsage !== null && !elecError && <p className="mt-2 text-sm text-primary">Tiêu thụ: <b>{elecUsage} số</b> · {formatVND(elecAmt)}</p>}</div>
              <div className="rounded-xl border border-line p-4"><p className="mb-3 text-sm font-bold text-ink">Nước (UC05.6) · {WATER_PRICE.toLocaleString('vi-VN')}đ/khối</p><div className="grid grid-cols-2 gap-3">{numField('Chỉ số cũ', 'oldWater', '')}{numField('Chỉ số mới *', 'newWater', 'Nhập chỉ số mới')}</div>{waterError && <p className="mt-2 text-[13px] font-medium text-red-600" role="alert">{waterError}</p>}{waterUsage !== null && !waterError && <p className="mt-2 text-sm text-primary">Tiêu thụ: <b>{waterUsage} khối</b> · {formatVND(waterAmt)}</p>}</div>
            </div>
            <div className="mt-4 rounded-xl bg-page px-4 py-3 text-sm">
              <div className="flex justify-between"><span>Tiền phòng</span><b>{formatVND(prev.rent)}</b></div>
              <div className="mt-1 flex justify-between"><span>Điện + Nước</span><b>{formatVND(elecAmt + waterAmt)}</b></div>
              <div className="mt-1 flex justify-between"><span>Phí dịch vụ (UC05.7)</span><b>{formatVND(SERVICE_FEE)}</b></div>
              <div className="mt-2 flex justify-between border-t border-line pt-2 text-base font-bold"><span>Tổng hóa đơn dự kiến</span><span className="text-primary">{formatVND(liveTotal)}</span></div>
              <p className="mt-2 text-[12px] text-amber-700">Backend gap: InvoiceItemType chỉ có ROOM_RENT/ELECTRICITY/WATER — dòng phí dịch vụ chưa có charge type tương ứng.</p>
            </div>
            <Button className="mt-4" disabled={!canCreate} onClick={createInvoice}>Tạo hóa đơn tháng 11 cho {meterRoom}</Button>
            {!canCreate && <p className="mt-2 text-[13px] text-muted">Nhập đủ chỉ số mới điện &amp; nước (≥ chỉ số cũ) để tạo hóa đơn.</p>}
            <p className="mt-3 text-[13px] text-muted">Chỉ số mới nhỏ hơn chỉ số cũ sẽ bị chặn. Chỉ số được gửi kèm trong CreateInvoiceRequest (backend không có endpoint meter-reading riêng).</p>
          </Card>
          <Card className="p-5">
            <h2 className="text-[17px] font-bold text-ink">Hóa đơn gần đây {chip === 'UNRECORDED' && '(mục Chưa ghi chỉ số xem ở form phía trên)'}</h2>
            {recent.length === 0 ? <p className="py-6 text-sm text-muted">Không có hóa đơn nào ở mục này.</p> : (
              <div className="mt-2 divide-y divide-line/70">{recent.map((inv) => { const od = isOverdue(inv); return (
                <button key={inv.id} onClick={() => openInvoice(inv)} className="flex w-full items-center gap-4 py-4 text-left">
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-ink">#{inv.code} · {inv.room}</span><span className="mt-0.5 block text-[13px] text-muted">{formatVND(inv.total)} · Hạn {inv.dueDate}{(inv.reminders?.length ?? 0) > 0 ? ` · Đã nhắc ${inv.reminders!.length} lần` : ''}</span></span>
                  <span className={cn('shrink-0 text-sm font-semibold', od ? 'text-red-600' : inv.status === 'PAID' ? 'text-green-700' : inv.status === 'CONFIRMED' ? 'text-primary' : 'text-amber-700')}>{od ? 'Quá hạn' : inv.status === 'PAID' ? 'Đã thanh toán' : inv.status === 'CONFIRMED' ? 'Đã xác nhận' : 'Chờ thanh toán'}</span>
                </button> ); })}</div>
            )}
          </Card>
        </div>
        {featured && (
          <Card className="cursor-pointer p-5 transition hover:shadow-md" onClick={() => openInvoice(featured)}>
            <div className="flex items-start justify-between gap-3"><h2 className="text-[17px] font-bold text-ink">Hóa đơn #{featured.code}</h2><Badge tone={isOverdue(featured) ? 'red' : 'amber'} dot>{isOverdue(featured) ? 'Quá hạn' : 'Chưa thanh toán'}</Badge></div>
            <div className="mt-5 space-y-3.5">{featured.items.map((it) => (<div key={it.label} className="flex items-center justify-between gap-4"><span className="text-sm text-muted">{it.label === 'Tiền điện' ? `Điện · ${it.detail}` : it.label === 'Tiền nước' ? `Nước · ${it.detail}` : it.label}</span><span className="text-sm font-semibold text-ink">{formatVND(it.amount)}</span></div>))}</div>
            <div className="mt-5 flex items-center justify-between border-t border-line pt-4"><span className="font-bold text-ink">Tổng cộng</span><span className="text-lg font-extrabold text-primary">{formatVND(featured.total)}</span></div>
            <p className="mt-3 text-[13px] text-muted">Hạn thanh toán: {featured.dueDate}</p>
            <Button size="lg" className="mt-5 w-full" onClick={(e) => { e.stopPropagation(); pickRoom(featured.room in PREV ? featured.room : 'Phòng 405'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Ghi chỉ số &amp; tạo hóa đơn tháng 11</Button>
          </Card>
        )}
      </div>
      <InvoiceDrawer invoice={selectedFull ?? selected} open={open} onClose={() => setOpen(false)} onRemind={handleRemind} onConfirmInvoice={(inv) => setConfirmAction({ kind: 'confirm', inv: inv as LInvoice })} onPay={(inv) => setConfirmAction({ kind: 'pay', inv: inv as LInvoice })} reminders={selectedFull?.reminders} />
      <ConfirmDialog open={confirmAction !== null} title={confirmAction?.kind === 'confirm' ? 'Xác nhận hóa đơn?' : 'Ghi nhận thanh toán?'} description={confirmAction ? (confirmAction.kind === 'confirm' ? `Hóa đơn ${confirmAction.inv.code} (${confirmAction.inv.room}) sẽ chuyển từ Chờ thanh toán sang Đã xác nhận.` : `Ghi nhận đã thu đủ ${formatVND(confirmAction.inv.total)} cho hóa đơn ${confirmAction.inv.code}. Hóa đơn sẽ chuyển sang Đã thanh toán.`) : ''} confirmLabel={confirmAction?.kind === 'confirm' ? 'Xác nhận' : 'Đã thu tiền'} onConfirm={doConfirmAction} onCancel={() => setConfirmAction(null)} />
    </div>
  );
}
