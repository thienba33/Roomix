'use client';
import type { Invoice } from '@/types';
import { formatVND, invoiceStatusLabel } from '@/lib/utils';
import { isOverdue } from '@/lib/landlord-store';
import Drawer from '@/components/ui/Drawer';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

const toneMap = { PENDING: 'amber', PAID: 'green', OVERDUE: 'red', CONFIRMED: 'indigo' } as const;

const itemLine = (label: string, detail: string) => {
  if (label === 'Tiền điện') return `Điện · ${detail}`;
  if (label === 'Tiền nước') return `Nước · ${detail}`;
  if (label === 'Tiền phòng') return label;
  return detail ? `${label} · ${detail}` : label;
};

interface Props {
  invoice: Invoice | null;
  open: boolean;
  onClose: () => void;
  onRemind?: (inv: Invoice) => void;
  onConfirmInvoice?: (inv: Invoice) => void;
  onPay?: (inv: Invoice) => void;
  reminders?: { date: string }[];
}

export default function InvoiceDrawer({ invoice, open, onClose, onRemind, onConfirmInvoice, onPay, reminders }: Props) {
  if (!invoice) return null;
  const overdue = isOverdue(invoice);
  const displayTone = overdue ? 'red' : toneMap[invoice.status as keyof typeof toneMap] ?? 'amber';
  return (
    <Drawer open={open} onClose={onClose} title={`Hóa đơn · ${invoice.room}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={displayTone as 'amber'|'green'|'red'|'indigo'}>{overdue ? 'Quá hạn' : invoiceStatusLabel[invoice.status]}</Badge>
        {overdue && <span className="text-[13px] font-medium text-red-600">Đã quá hạn thanh toán</span>}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div><p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Mã hóa đơn</p><p className="mt-0.5 font-semibold text-ink">#{invoice.code ?? invoice.id}</p></div>
        <div><p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Kỳ</p><p className="mt-0.5 font-semibold text-ink">{invoice.period}</p></div>
        <div><p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Khách thuê</p><p className="mt-0.5 text-ink">{invoice.tenant}</p></div>
        <div><p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Hạn thanh toán</p><p className={`mt-0.5 font-semibold ${overdue ? 'text-red-600' : 'text-ink'}`}>{invoice.dueDate}</p></div>
      </div>

      <h4 className="mt-6 text-sm font-bold text-ink">Chi tiết khoản thu</h4>
      <div className="mt-3 space-y-3">
        {invoice.items.map((it) => (
          <div key={it.label} className="flex items-center justify-between gap-4">
            <p className="text-sm text-ink">{itemLine(it.label, it.detail)}</p>
            <p className="text-sm font-semibold text-ink">{formatVND(it.amount)}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-800">Hóa đơn minh họa · Xác nhận các khoản thu trước khi thanh toán.</p>

      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <span className="font-bold text-ink">Tổng cộng / Còn phải thu</span>
        <span className="font-extrabold text-primary">{formatVND(invoice.total)}</span>
      </div>

      <h4 className="mt-8 text-sm font-bold text-ink">Lịch sử</h4>
      <div className="mt-3 space-y-2.5">
        {invoice.history.length === 0 && <p className="text-sm text-muted">Chưa có lịch sử.</p>}
        {invoice.history.map((h, i) => (
          <p key={i} className="text-sm text-muted">
            {h.date} · {h.label} · {formatVND(h.amount)}
          </p>
        ))}
        {reminders && reminders.length > 0 && (
          <div className="border-t border-line/60 pt-2">
            <p className="text-[13px] font-semibold text-ink">Đã gửi nhắc ({reminders.length})</p>
            {reminders.map((r, i) => <p key={i} className="mt-1 text-sm text-muted">Nhắc thanh toán · {r.date}</p>)}
          </div>
        )}
      </div>

      <div className="mt-7 flex flex-wrap gap-2">
        {invoice.status === 'PENDING' && onConfirmInvoice && (
          <Button onClick={() => onConfirmInvoice(invoice)}>Xác nhận hóa đơn</Button>
        )}
        {(invoice.status === 'PENDING' || invoice.status === 'CONFIRMED') && onPay && (
          <Button variant={invoice.status === 'CONFIRMED' ? 'primary' : 'outline'} onClick={() => onPay(invoice)}>Ghi nhận thanh toán</Button>
        )}
        {invoice.status !== 'PAID' && (
          <Button variant="outline" onClick={() => onRemind?.(invoice)}>Gửi nhắc</Button>
        )}
        {invoice.status === 'PAID' && <span className="text-sm font-semibold text-green-700">✓ Đã thanh toán đủ</span>}
      </div>
    </Drawer>
  );
}
