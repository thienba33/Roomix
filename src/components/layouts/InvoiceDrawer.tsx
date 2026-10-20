'use client';
import type { Invoice } from '@/types';
import { formatVND, invoiceStatusLabel } from '@/lib/utils';
import Drawer from '@/components/ui/Drawer';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

const toneMap = { PENDING: 'amber', PAID: 'green', OVERDUE: 'red', CONFIRMED: 'indigo' } as const;

// Reference B13 lines fold the detail into the label: "Điện · 86 số × 3.500đ".
const itemLine = (label: string, detail: string) => {
  if (label === 'Tiền điện') return `Điện · ${detail}`;
  if (label === 'Tiền nước') return `Nước · ${detail}`;
  if (label === 'Tiền phòng') return label;
  return detail ? `${label} · ${detail}` : label;
};

export default function InvoiceDrawer({ invoice, open, onClose, onRemind }: { invoice: Invoice | null; open: boolean; onClose: () => void; onRemind?: (inv: Invoice) => void }) {
  if (!invoice) return null;
  return (
    <Drawer open={open} onClose={onClose} title={`Hóa đơn · ${invoice.room}`}>
      <Badge tone={toneMap[invoice.status]}>{invoiceStatusLabel[invoice.status]}</Badge>

      <div className="mt-6 space-y-4">
        {invoice.items.map((it) => (
          <div key={it.label} className="flex items-center justify-between gap-4">
            <p className="text-sm text-ink">{itemLine(it.label, it.detail)}</p>
            <p className="text-sm font-semibold text-ink">{formatVND(it.amount)}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
        <span className="font-bold text-ink">Tổng cộng</span>
        <span className="font-extrabold text-primary">{formatVND(invoice.total)}</span>
      </div>

      <h4 className="mt-8 text-sm font-bold text-ink">Lịch sử thanh toán</h4>
      <div className="mt-3 space-y-2.5">
        {invoice.history.map((h, i) => (
          <p key={i} className="text-sm text-muted">
            {h.label.replace('Hóa đơn ', '')} · Đã thanh toán · {formatVND(h.amount)}
          </p>
        ))}
      </div>

      <Button className="mt-7" onClick={() => onRemind?.(invoice)}>Gửi nhắc</Button>
    </Drawer>
  );
}
