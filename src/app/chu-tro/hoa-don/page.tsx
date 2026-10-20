'use client';
import { useState } from 'react';
import { invoices } from '@/lib/data';
import type { Invoice, InvoiceStatus } from '@/types';
import { cn, formatVND, invoiceStatusLabel } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import InvoiceDrawer from '@/components/layouts/InvoiceDrawer';
import { useToast } from '@/components/ui/Toast';

type Chip = 'CURRENT' | 'OVERDUE' | 'UNRECORDED';

const CHIPS: { key: Chip; label: string }[] = [
  { key: 'CURRENT', label: 'Tháng 10/2026' },
  { key: 'OVERDUE', label: 'Hóa đơn quá hạn' },
  { key: 'UNRECORDED', label: 'Chưa ghi chỉ số' },
];

// Mock meter readings for October (UC05.5) — Phòng 405 has not been recorded yet.
const METER_ROWS: { room: string; from: string; to: string; usage: string; recorded: boolean }[] = [
  { room: 'Phòng 302', from: '1.240', to: '1.312', usage: '72 số', recorded: true },
  { room: 'Phòng 305', from: '980', to: '1.045', usage: '65 số', recorded: true },
  { room: 'Phòng 308', from: '2.010', to: '2.096', usage: '86 số', recorded: true },
  { room: 'Phòng 405', from: '—', to: 'chưa ghi', usage: '—', recorded: false },
];

const statusText: Record<InvoiceStatus, string> = {
  PENDING: 'text-amber-700',
  PAID: 'text-green-700',
  OVERDUE: 'text-red-600',
  CONFIRMED: 'text-primary',
};

const itemLine = (label: string, detail: string) => {
  if (label === 'Tiền điện') return `Điện · ${detail}`;
  if (label === 'Tiền nước') return `Nước · ${detail}`;
  return label;
};

export default function HoaDonPage() {
  const toast = useToast();
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [open, setOpen] = useState(false);
  const [chip, setChip] = useState<Chip>('CURRENT');

  const featured = invoices[0];
  const meterRows = chip === 'UNRECORDED' ? METER_ROWS.filter((r) => !r.recorded) : METER_ROWS;
  const recent = chip === 'OVERDUE' ? invoices.filter((i) => i.status === 'OVERDUE') : invoices;

  const openInvoice = (inv: Invoice) => {
    setSelected(inv);
    setOpen(true);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px] font-extrabold text-ink">Điện – Nước &amp; Hóa đơn</h1>
        <p className="mt-1 text-sm text-muted">Kỳ tháng 10/2026</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <button
            key={c.key}
            onClick={() => setChip(c.key)}
            className={cn(
              'rounded-full px-4 py-2 text-sm transition',
              chip === c.key
                ? 'bg-primary-soft font-semibold text-primary-dark'
                : 'font-medium text-muted hover:bg-page hover:text-ink',
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1.8fr_1fr]">
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="text-[17px] font-bold text-ink">Ghi chỉ số điện · tháng 10</h2>
            <div className="mt-2 divide-y divide-line/70">
              {meterRows.map((r) => (
                <div key={r.room} className="grid grid-cols-[1fr_1fr_auto] items-center gap-4 py-4">
                  <span className="text-sm font-medium text-ink">{r.room}</span>
                  <span className="text-sm text-muted">{r.from} → {r.to}</span>
                  <span className={cn('text-sm font-semibold', r.recorded ? 'text-primary' : 'text-muted')}>{r.usage}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[13px] text-muted">Chỉ số mới nhỏ hơn chỉ số cũ sẽ bị chặn.</p>
          </Card>

          <Card className="p-5">
            <h2 className="text-[17px] font-bold text-ink">Hóa đơn gần đây</h2>
            {recent.length === 0 ? (
              <p className="py-6 text-sm text-muted">Không có hóa đơn nào ở mục này.</p>
            ) : (
              <div className="mt-2 divide-y divide-line/70">
                {recent.map((inv) => (
                  <button key={inv.id} onClick={() => openInvoice(inv)} className="flex w-full items-center gap-4 py-4 text-left">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">
                        #{inv.code} · {inv.room}
                      </span>
                      <span className="mt-0.5 block text-[13px] text-muted">{formatVND(inv.total)}</span>
                    </span>
                    <span className={cn('shrink-0 text-sm font-semibold', statusText[inv.status])}>
                      {inv.status === 'OVERDUE' ? 'Quá hạn' : invoiceStatusLabel[inv.status]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card className="cursor-pointer p-5 transition hover:shadow-md" onClick={() => openInvoice(featured)}>
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-[17px] font-bold text-ink">Hóa đơn #{featured.code}</h2>
            <Badge tone="amber" dot>Chưa thanh toán</Badge>
          </div>
          <div className="mt-5 space-y-3.5">
            {featured.items.map((it) => (
              <div key={it.label} className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted">{itemLine(it.label, it.detail)}</span>
                <span className="text-sm font-semibold text-ink">{formatVND(it.amount)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
            <span className="font-bold text-ink">Tổng cộng</span>
            <span className="text-lg font-extrabold text-primary">{formatVND(featured.total)}</span>
          </div>
          <p className="mt-3 text-[13px] text-muted">Hạn thanh toán: {featured.dueDate} · Có thể hẹn ngày gửi</p>
          <Button
            size="lg"
            className="mt-5 w-full"
            onClick={(e) => {
              e.stopPropagation();
              toast.push('Đã tạo hóa đơn tháng 11');
            }}
          >
            Tạo hóa đơn tháng 11
          </Button>
        </Card>
      </div>

      <InvoiceDrawer
        invoice={selected}
        open={open}
        onClose={() => setOpen(false)}
        onRemind={(inv) => toast.push('Đã gửi nhắc thanh toán', `${inv.room} · ${inv.period}`)}
      />
    </div>
  );
}
