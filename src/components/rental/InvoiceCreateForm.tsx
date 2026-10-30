'use client';

import { useRef, useState, type FormEvent } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { formatVND } from '@/lib/utils';
import { invoiceReadingDates } from '@/lib/invoice-dates';
import { createInvoice, type InvoiceRecord } from '@/services/backend/invoices';
import { todayVN } from '@/services/backend/rental';

export default function InvoiceCreateForm({ tenancyId, billingMonth, startDate, endDate, oldElectricityVal, oldWaterVal, monthlyRent, electricityUnitPrice, waterUnitPrice, onCreated }: {
  tenancyId: string; billingMonth: string; oldElectricityVal: number; oldWaterVal: number;
  startDate: string; endDate: string;
  monthlyRent: number; electricityUnitPrice: number; waterUnitPrice: number;
  onCreated: (invoice: InvoiceRecord) => void;
}) {
  const today = todayVN();
  const readingDates = invoiceReadingDates(billingMonth, startDate, endDate, today);
  const [readingDate, setReadingDate] = useState(readingDates.max);
  const [dueDate, setDueDate] = useState(() => new Date(Date.parse(readingDates.max) + 7 * 86400000).toISOString().slice(0, 10));
  const [newElectricity, setNewElectricity] = useState('');
  const [newWater, setNewWater] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const electricityUsage = newElectricity === '' ? null : Number(newElectricity) - oldElectricityVal;
  const waterUsage = newWater === '' ? null : Number(newWater) - oldWaterVal;
  const valid = electricityUsage !== null && waterUsage !== null && Number.isFinite(electricityUsage) && Number.isFinite(waterUsage) && electricityUsage >= 0 && waterUsage >= 0;
  const electricityAmount = valid ? Math.round(electricityUsage * electricityUnitPrice * 100) / 100 : 0;
  const waterAmount = valid ? Math.round(waterUsage * waterUnitPrice * 100) / 100 : 0;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (lock.current) return;
    if (!valid) { setError('Chỉ số điện, nước mới phải lớn hơn hoặc bằng chỉ số kỳ trước.'); return; }
    if (!readingDate || readingDate < readingDates.min || readingDate > readingDates.max) {
      setError('Ngày ghi chỉ số phải thuộc kỳ hóa đơn, nằm trong thời hạn hợp đồng và không sau hôm nay.'); return;
    }
    if (!dueDate || dueDate < readingDate) { setError('Hạn thanh toán phải từ ngày ghi chỉ số trở đi.'); return; }
    lock.current = true; setBusy(true); setError('');
    try {
      const invoice = await createInvoice({
        tenancyId, billingMonth, readingDate, dueDate,
        oldElectricityVal, newElectricityVal: Number(newElectricity), oldWaterVal, newWaterVal: Number(newWater),
      });
      setError(''); onCreated(invoice);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể tạo hóa đơn.'); }
    finally { lock.current = false; setBusy(false); }
  };
  return <form onSubmit={submit} className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl bg-page p-4"><p className="text-xs text-muted">Chỉ số điện kỳ trước</p><p className="mt-1 font-bold">{oldElectricityVal}</p><Input name="newElectricity" label="Chỉ số điện mới" type="number" min={oldElectricityVal} step="0.01" required value={newElectricity} onChange={(event) => setNewElectricity(event.target.value)} className="mt-3" /><p className="mt-2 text-xs text-muted">{formatVND(electricityUnitPrice)} / kWh</p></div><div className="rounded-xl bg-page p-4"><p className="text-xs text-muted">Chỉ số nước kỳ trước</p><p className="mt-1 font-bold">{oldWaterVal}</p><Input name="newWater" label="Chỉ số nước mới" type="number" min={oldWaterVal} step="0.01" required value={newWater} onChange={(event) => setNewWater(event.target.value)} className="mt-3" /><p className="mt-2 text-xs text-muted">{formatVND(waterUnitPrice)} / m³</p></div></div>
    <div className="grid gap-4 sm:grid-cols-2"><Input name="readingDate" label="Ngày ghi chỉ số" type="date" required value={readingDate} min={readingDates.min} max={readingDates.max} onChange={(event) => setReadingDate(event.target.value)} /><Input name="dueDate" label="Hạn thanh toán" type="date" required value={dueDate} min={readingDate || readingDates.min} onChange={(event) => setDueDate(event.target.value)} /></div>
    <div className="rounded-2xl border border-primary/20 bg-primary-soft/30 p-4 text-sm"><h3 className="font-bold">Tổng tiền dự kiến · kỳ {billingMonth}</h3><dl className="mt-3 space-y-2"><div className="flex justify-between gap-3"><dt>Tiền phòng</dt><dd>{formatVND(monthlyRent)}</dd></div><div className="flex justify-between gap-3"><dt>Điện {valid ? `(${electricityUsage} kWh)` : ''}</dt><dd>{formatVND(electricityAmount)}</dd></div><div className="flex justify-between gap-3"><dt>Nước {valid ? `(${waterUsage} m³)` : ''}</dt><dd>{formatVND(waterAmount)}</dd></div><div className="flex justify-between gap-3 border-t border-primary/20 pt-3 text-base font-extrabold"><dt>Tổng cộng</dt><dd className="text-primary">{formatVND(monthlyRent + electricityAmount + waterAmount)}</dd></div></dl></div>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <Button type="submit" disabled={!valid || busy}>Tạo hóa đơn</Button>
  </form>;
}
