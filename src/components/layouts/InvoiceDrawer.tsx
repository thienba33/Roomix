'use client';
import type { Invoice } from '@/types';
import { formatVND, invoiceStatusLabel } from '@/lib/utils';
import Drawer from '@/components/ui/Drawer';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

const toneMap = { PENDING: 'amber', PAID: 'green', OVERDUE: 'red', CONFIRMED: 'indigo' } as const;

export default function InvoiceDrawer({ invoice, open, onClose, onRemind }: { invoice: Invoice | null; open: boolean; onClose: () => void; onRemind?: (inv: Invoice) => void }) {
  if (!invoice) return null;
  return (
    <Drawer open={open} onClose={onClose} title={`Hóa đơn ${invoice.period.toLowerCase()} · ${invoice.room}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-ink">{invoice.tenant}</p>
          <p className="text-sm text-muted">Hạn thanh toán: {invoice.dueDate}</p>
        </div>
        <Badge tone={toneMap[invoice.status]} dot>{invoiceStatusLabel[invoice.status]}</Badge>
      </div>

      <div className="mt-6 space-y-3">
        {invoice.items.map((it) => (
          <div key={it.label} className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-ink">{it.label}</p>
              <p className="text-[13px] text-muted">{it.detail}</p>
            </div>
            <p className="text-sm font-semibold text-ink">{formatVND(it.amount)}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <span className="font-bold text-ink">Tổng cộng</span>
        <span className="text-lg font-extrabold text-ink">{formatVND(invoice.total)}</span>
      </div>

      <h4 className="mt-7 text-sm font-bold text-ink">Lịch sử thanh toán</h4>
      <div className="mt-2.5 space-y-2.5">
        {invoice.history.map((h, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl bg-page px-4 py-3 text-sm">
            <div>
              <p className="font-medium text-ink">{h.label}</p>
              <p className="text-[13px] text-muted">{h.date}</p>
            </div>
            <span className="font-semibold text-ink">{formatVND(h.amount)}</span>
          </div>
        ))}
      </div>

      <Button className="mt-7 w-full" onClick={() => onRemind?.(invoice)}>Gửi nhắc</Button>
    </Drawer>
  );
}
