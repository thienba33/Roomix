'use client';
import { useState } from 'react';
import { invoices } from '@/lib/data';
import type { Invoice, InvoiceStatus } from '@/types';
import { formatVND, invoiceStatusLabel } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import InvoiceDrawer from '@/components/layouts/InvoiceDrawer';
import { useToast } from '@/components/ui/Toast';

const invTone: Record<InvoiceStatus, 'amber' | 'green' | 'red' | 'indigo'> = {
  PENDING: 'amber',
  PAID: 'green',
  OVERDUE: 'red',
  CONFIRMED: 'indigo',
};

export default function HoaDonPage() {
  const toast = useToast();
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [open, setOpen] = useState(false);
  const overdue = invoices.filter((i) => i.status === 'OVERDUE');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold text-ink">Hóa đơn</h1>
          <p className="mt-1 text-sm text-muted">Quản lý hóa đơn tiền phòng, điện và nước</p>
        </div>
        {overdue.length > 0 && (
          <span className="rounded-full bg-red-50 px-3.5 py-1.5 text-[13px] font-semibold text-red-700">
            {overdue.length} hóa đơn quá hạn
          </span>
        )}
      </div>

      <div className="space-y-3">
        {invoices.map((inv) => (
          <Card
            key={inv.id}
            onClick={() => {
              setSelected(inv);
              setOpen(true);
            }}
            className="cursor-pointer p-5 transition hover:shadow-md"
          >
            <div className="flex flex-wrap items-center gap-4">
              <div className="min-w-52 flex-1">
                <p className="font-bold text-ink">{inv.room} · {inv.tenant}</p>
                <p className="mt-0.5 text-sm text-muted">{inv.period} · Hạn {inv.dueDate}</p>
                {inv.code && <p className="mt-0.5 text-[13px] text-muted">Mã: {inv.code}</p>}
              </div>
              <p className="shrink-0 text-lg font-extrabold text-ink">{formatVND(inv.total)}</p>
              <Badge tone={invTone[inv.status]} dot>{invoiceStatusLabel[inv.status]}</Badge>
            </div>
          </Card>
        ))}
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
