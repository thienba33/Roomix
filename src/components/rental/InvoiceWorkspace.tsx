'use client';

import { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRoomDetails } from '@/hooks/useRoomDetails';
import { useInvoices } from '@/hooks/useInvoices';
import { useRental } from '@/hooks/useRental';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import InvoiceCreateForm from './InvoiceCreateForm';
import { formatVND } from '@/lib/utils';
import {
  confirmInvoice, correctInvoice, createVnpayPaymentUrl, devConfirmVnpay, disputeInvoice,
  invoiceDraftFor, isInvoiceOverdue, outstanding, payInvoice, remindInvoice, resolveInvoiceDispute,
  type InvoiceRecord, type PaymentMethod
} from '@/services/backend/invoices';
import { todayVN } from '@/services/backend/rental';


type Action = { kind: 'confirm' | 'pay' | 'dispute' | 'resolve' | 'correct'; invoice: InvoiceRecord };
const actionTitles: Record<Action['kind'], string> = { confirm: 'Xác nhận hóa đơn', pay: 'Ghi nhận đã thu tiền', dispute: 'Gửi tranh chấp', resolve: 'Giải quyết tranh chấp', correct: 'Sửa hóa đơn' };
function InvoiceStatus({ invoice }: { invoice: InvoiceRecord }) {
  if (invoice.disputed) return <Badge tone="red" dot>Đang tranh chấp</Badge>;
  if (isInvoiceOverdue(invoice)) return <Badge tone="red" dot>Quá hạn</Badge>;
  return <Badge tone={invoice.status === 'PAID' ? 'green' : invoice.status === 'CONFIRMED' ? 'indigo' : 'amber'} dot>{invoice.status === 'PAID' ? 'Đã thanh toán' : invoice.status === 'CONFIRMED' ? 'Khách đã xác nhận' : 'Chờ khách xác nhận'}</Badge>;
}

export default function InvoiceWorkspace({ role }: { role: 'TENANT' | 'LANDLORD' }) {
  const { user, ready: authReady, openAuth } = useAuth();
  const rental = useRental();
  const catalog = useRoomDetails([...rental.requests.map((item) => item.roomId), ...rental.tenancies.map((item) => item.roomId)]);
  const invoices = useInvoices();
  const [selectedTenancy, setSelectedTenancy] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [action, setAction] = useState<Action | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const landlord = role === 'LANDLORD';
  const title = landlord ? 'Hóa đơn & chỉ số' : 'Hóa đơn của tôi';
  const roomName = (roomId: string) => catalog.items.find((item) => item.roomId === roomId)?.title ?? `Phòng ${roomId}`;
  const tenancyById = (id: string) => rental.tenancies.find((item) => item.id === id);
  const active = rental.tenancies.filter((item) => item.status === 'ACTIVE');
  const tenancyId = active.some((item) => item.id === selectedTenancy) ? selectedTenancy : active[0]?.id;
  let draft: ReturnType<typeof invoiceDraftFor> | null = null;
  let draftError = '';
  if (landlord && tenancyId && authReady && rental.ready && invoices.ready) {
    try { draft = invoiceDraftFor(tenancyId, rental.tenancies, invoices.items); }
    catch (cause) { draftError = cause instanceof Error ? cause.message : 'Chưa thể lập hóa đơn.'; }
  }
  const sorted = [...invoices.items].sort((a, b) => b.billingMonth.localeCompare(a.billingMonth) || b.createdAt.localeCompare(a.createdAt));
  const filtered = sorted.filter((item) => filter === 'ALL' || filter === 'OVERDUE' && isInvoiceOverdue(item) || item.status === filter);
  const current = filtered.find((item) => item.id === selectedInvoice) ?? filtered[0];
  const open = (kind: Action['kind'], invoice: InvoiceRecord) => { setError(''); setNotice(''); setAction({ kind, invoice }); };
  const act = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!action || lock.current) return;
    lock.current = true; setBusy(true);
    const data = new FormData(event.currentTarget);
    try {
      const { invoice, kind } = action;
      if (kind === 'confirm') await confirmInvoice(invoice.id);
      else if (kind === 'pay') await payInvoice(invoice.id, String(data.get('paymentMethod')) as PaymentMethod);
      else if (kind === 'dispute') await disputeInvoice(invoice.id, String(data.get('reason')));
      else if (kind === 'resolve') await resolveInvoiceDispute(invoice.id, String(data.get('reason')));
      else await correctInvoice(invoice.id, {
        expectedRevision: invoice.revision, reason: String(data.get('reason')),
        readingDate: String(data.get('readingDate')), dueDate: String(data.get('dueDate')),
        roomRent: Number(data.get('roomRent')), electricityUnitPrice: Number(data.get('electricityUnitPrice')),
        waterUnitPrice: Number(data.get('waterUnitPrice')), newElectricityVal: Number(data.get('newElectricityVal')),
        newWaterVal: Number(data.get('newWaterVal')),
      });
      setAction(null); setNotice(kind === 'pay' ? 'Đã ghi nhận tiền đã thu.' : kind === 'confirm' ? 'Bạn đã xác nhận hóa đơn.' : kind === 'correct' ? 'Đã sửa hóa đơn. Khách thuê cần xác nhận lại.' : kind === 'resolve' ? 'Đã ghi nhận giải quyết. Khách thuê cần xác nhận lại.' : 'Đã gửi tranh chấp.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể cập nhật hóa đơn.'); }
    finally { lock.current = false; setBusy(false); }
  };
  const remind = async (invoice: InvoiceRecord) => {
    try { await remindInvoice(invoice.id); setError(''); setNotice('Đã ghi nhận nhắc thanh toán hôm nay.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể nhắc thanh toán.'); }
  };
  const payVnpay = async (inv: InvoiceRecord) => {
    try {
      setBusy(true);
      setError('');
      const res = await createVnpayPaymentUrl(inv.id);
      if (res?.paymentUrl) {
        window.open(res.paymentUrl, '_blank');
        setNotice('Đã mở cổng thanh toán VNPAY. Sau khi thanh toán thành công, trạng thái hóa đơn sẽ tự động cập nhật.');
      }
    } catch (cause) {
      try {
        await devConfirmVnpay(inv.id);
        setNotice('Đã xác nhận thanh toán VNPAY thành công (môi trường mô phỏng dev).');
      } catch {
        setError(cause instanceof Error ? cause.message : 'Không thể khởi tạo thanh toán VNPAY.');
      }
    } finally {
      setBusy(false);
    }
  };
  if (!authReady || !rental.ready || !catalog.ready || !invoices.ready) return <div role="status" className="py-10 text-muted">Đang tải hóa đơn…</div>;
  if (!user) return <div className="space-y-4 py-10"><h1 className="text-2xl font-bold">{title}</h1><p>Đăng nhập để xem hóa đơn.</p><Button onClick={() => openAuth('login', landlord ? 'landlord' : 'tenant')}>Đăng nhập</Button></div>;
  if (user.role !== role) return <p role="alert" className="py-10">Tài khoản hiện tại không có quyền xem hóa đơn này.</p>;
  if (rental.error || catalog.error || invoices.error) return <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5"><h1 className="font-bold">Chưa thể tải hóa đơn</h1><p className="mt-2 text-sm">{rental.error || catalog.error || invoices.error}</p></div>;
  return <div className="space-y-6 pb-8">
    <header className="border-b border-line pb-6"><h1 className="text-[28px] font-extrabold tracking-tight sm:text-[32px]">{title}</h1><p className="mt-2 text-sm leading-6 text-muted">{landlord ? 'Ghi chỉ số theo hợp đồng đang thuê, lập hóa đơn và theo dõi tiền đã thu.' : 'Kiểm tra tiền phòng, điện, nước, xác nhận hóa đơn và thanh toán trực tuyến qua VNPAY.'}</p></header>
    {notice && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
    {landlord && <section aria-labelledby="create-title" className="rounded-2xl border border-line bg-white p-5 sm:p-6"><div className="mb-5 flex flex-wrap items-start justify-between gap-2"><div><h2 id="create-title" className="text-lg font-bold">Lập hóa đơn kỳ tiếp theo</h2><p className="mt-1 text-sm text-muted">Chỉ hợp đồng đang thuê và kỳ liên tiếp mới có thể lập hóa đơn.</p></div><Link href="/landlord/tenants" className="text-sm font-semibold text-primary">Xem hợp đồng</Link></div>{active.length ? <><label htmlFor="invoice-tenancy" className="mb-2 block text-sm font-semibold">Hợp đồng đang thuê</label><select id="invoice-tenancy" value={tenancyId} onChange={(event) => setSelectedTenancy(event.target.value)} className="mb-5 w-full max-w-lg rounded-xl border border-line bg-white px-3 py-3 text-sm focus-visible:outline-2 focus-visible:outline-primary">{active.map((item) => <option key={item.id} value={item.id}>{roomName(item.roomId)} · {item.contractCode}</option>)}</select>{draft ? <InvoiceCreateForm key={`${tenancyId}:${draft.billingMonth}`} tenancyId={tenancyId} billingMonth={draft.billingMonth} oldElectricityVal={draft.oldElectricityVal} oldWaterVal={draft.oldWaterVal} monthlyRent={draft.tenancy.monthlyRent} electricityUnitPrice={draft.tenancy.electricityUnitPrice} waterUnitPrice={draft.tenancy.waterUnitPrice} onCreated={(invoice) => { setSelectedInvoice(invoice.id); setFilter('ALL'); setNotice(`Đã tạo hóa đơn ${invoice.invoiceCode}. Đang chờ khách thuê xác nhận.`); }} /> : <p role="status" className="rounded-xl bg-page p-4 text-sm text-muted">{draftError}</p>}</> : <div className="rounded-xl bg-page p-5 text-sm text-muted">Chưa có hợp đồng đang thuê. Xác nhận cọc cho hợp đồng trước khi lập hóa đơn.</div>}</section>}
    <section aria-labelledby="invoice-list-title" className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="invoice-list-title" className="text-lg font-bold">Danh sách hóa đơn</h2><p className="mt-1 text-sm text-muted">{filtered.length} hóa đơn phù hợp</p></div><label className="flex items-center gap-2 text-sm font-semibold">Trạng thái<select aria-label="Lọc hóa đơn" value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-xl border border-line bg-white px-3 py-2 font-normal focus-visible:outline-2 focus-visible:outline-primary"><option value="ALL">Tất cả</option><option value="PENDING">Chờ xác nhận</option><option value="CONFIRMED">Đã xác nhận</option><option value="PAID">Đã thanh toán</option><option value="OVERDUE">Quá hạn</option></select></label></div>{filtered.length ? <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)]"><div className="space-y-3">{filtered.map((invoice) => { const tenancy = tenancyById(invoice.tenancyId); return <button type="button" key={invoice.id} onClick={() => setSelectedInvoice(invoice.id)} aria-pressed={current?.id === invoice.id} className={`w-full rounded-2xl border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-primary ${current?.id === invoice.id ? 'border-primary bg-primary-soft/30' : 'border-line bg-white hover:border-primary/40'}`}><div className="flex flex-wrap items-start justify-between gap-2"><span className="font-bold">{roomName(tenancy?.roomId ?? '')} · {invoice.billingMonth}</span><InvoiceStatus invoice={invoice} /></div><p className="mt-2 break-all text-xs text-muted">{invoice.invoiceCode}</p><div className="mt-3 flex flex-wrap justify-between gap-2 text-sm"><span>Hạn {invoice.dueDate}</span><strong>{formatVND(outstanding(invoice))} còn phải thu</strong></div></button>; })}</div>{current && <InvoiceDetails invoice={current} roomName={roomName(tenancyById(current.tenancyId)?.roomId ?? '')} landlord={landlord} onAction={open} onRemind={remind} onPayVnpay={payVnpay} />}</div> : <div className="rounded-2xl border border-line bg-white px-6 py-10 text-center"><h3 className="font-bold">{filter === 'ALL' ? 'Chưa có hóa đơn' : 'Không có hóa đơn ở trạng thái này'}</h3><p className="mt-2 text-sm text-muted">{filter === 'ALL' ? landlord ? 'Chọn hợp đồng đang thuê để ghi chỉ số và lập hóa đơn.' : 'Hóa đơn sẽ xuất hiện khi chủ trọ lập cho hợp đồng đang thuê.' : 'Chọn trạng thái khác để xem danh sách.'}</p></div>}</section>
    <Modal open={!!action} onClose={() => { if (!busy) setAction(null); }} title={action ? actionTitles[action.kind] : undefined} widthClass="max-w-xl"><form key={`${action?.kind}:${action?.invoice.id}`} onSubmit={act} className="space-y-4">{action?.kind === 'confirm' && <p className="text-sm leading-6">Bạn xác nhận các chỉ số và tổng tiền <strong>{formatVND(action.invoice.totalAmount)}</strong>. Chủ trọ chỉ ghi nhận đã thu sau bước này.</p>}{action?.kind === 'pay' && <><p className="text-sm">Chỉ ghi nhận khi đã thu đủ <strong>{formatVND(outstanding(action.invoice))}</strong>.</p><label className="block text-sm font-semibold">Phương thức nhận tiền<select name="paymentMethod" className="mt-2 w-full rounded-xl border border-line bg-white p-3 text-sm"><option value="CASH">Tiền mặt</option><option value="BANK_TRANSFER">Chuyển khoản</option></select></label></>}{(action?.kind === 'dispute' || action?.kind === 'resolve' || action?.kind === 'correct') && <label className="block text-sm font-semibold">Lý do<textarea name="reason" required maxLength={2000} rows={3} className="mt-2 w-full rounded-xl border border-line p-3 text-sm" placeholder="Nêu rõ lý do…" /></label>}{action?.kind === 'correct' && <div className="grid gap-3 sm:grid-cols-2"><Input name="readingDate" label="Ngày ghi chỉ số" type="date" required defaultValue={action.invoice.reading.readingDate} /><Input name="dueDate" label="Hạn thanh toán" type="date" required defaultValue={action.invoice.dueDate} /><Input name="roomRent" label="Tiền phòng" type="number" required min="0.01" step="0.01" defaultValue={action.invoice.items[0]?.unitPrice} /><Input name="electricityUnitPrice" label="Đơn giá điện" type="number" required min="0" step="0.01" defaultValue={action.invoice.items[1]?.unitPrice} /><Input name="waterUnitPrice" label="Đơn giá nước" type="number" required min="0" step="0.01" defaultValue={action.invoice.items[2]?.unitPrice} /><Input name="newElectricityVal" label="Chỉ số điện mới" type="number" required min={action.invoice.reading.oldElectricityVal} step="0.01" defaultValue={action.invoice.reading.newElectricityVal} /><Input name="newWaterVal" label="Chỉ số nước mới" type="number" required min={action.invoice.reading.oldWaterVal} step="0.01" defaultValue={action.invoice.reading.newWaterVal} /></div>}{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setAction(null)}>Đóng</Button><Button type="submit" disabled={busy}>{action?.kind === 'pay' ? 'Đã thu tiền' : action?.kind === 'confirm' ? 'Xác nhận hóa đơn' : action?.kind === 'correct' ? 'Lưu bản sửa' : action?.kind === 'resolve' ? 'Ghi nhận giải quyết' : 'Gửi tranh chấp'}</Button></div></form></Modal>
  </div>;
}

function InvoiceDetails({ invoice, roomName, landlord, onAction, onRemind, onPayVnpay }: { invoice: InvoiceRecord; roomName: string; landlord: boolean; onAction: (kind: Action['kind'], invoice: InvoiceRecord) => void; onRemind: (invoice: InvoiceRecord) => void; onPayVnpay: (invoice: InvoiceRecord) => void }) {
  return <article className="min-w-0 rounded-2xl border border-line bg-white p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs text-muted">{invoice.invoiceCode}</p><h3 className="mt-1 text-lg font-bold">{roomName} · {invoice.billingMonth}</h3></div><InvoiceStatus invoice={invoice} /></div><dl className="mt-5 grid gap-3 border-t border-line pt-5 text-sm sm:grid-cols-2"><div><dt className="text-muted">Ngày ghi chỉ số</dt><dd className="font-semibold">{invoice.reading.readingDate}</dd></div><div><dt className="text-muted">Hạn thanh toán</dt><dd className="font-semibold">{invoice.dueDate}</dd></div><div><dt className="text-muted">Chỉ số điện</dt><dd>{invoice.reading.oldElectricityVal} → {invoice.reading.newElectricityVal}</dd></div><div><dt className="text-muted">Chỉ số nước</dt><dd>{invoice.reading.oldWaterVal} → {invoice.reading.newWaterVal}</dd></div></dl><h4 className="mt-6 text-sm font-bold">Các khoản phải thu</h4><dl className="mt-3 space-y-3 text-sm">{invoice.items.map((item) => <div key={item.id} className="flex justify-between gap-3"><dt>{item.itemName}{item.itemType !== 'ROOM_RENT' && <span className="text-muted"> · {item.quantity} × {formatVND(item.unitPrice)}</span>}</dt><dd className="shrink-0 font-semibold">{formatVND(item.totalPrice)}</dd></div>)}</dl><div className="mt-5 flex justify-between gap-3 border-t border-line pt-4 font-bold"><span>Tổng hóa đơn</span><strong className="text-primary">{formatVND(invoice.totalAmount)}</strong></div><p className="mt-2 text-sm text-muted">Còn phải thu: {formatVND(outstanding(invoice))}</p>{invoice.paymentMethod && <p className="mt-2 text-sm text-green-700">Đã ghi nhận {invoice.paymentMethod === 'SETTLEMENT' ? 'quyết toán hợp đồng' : invoice.paymentMethod === 'CASH' ? 'tiền mặt' : 'chuyển khoản'} ngày {invoice.paymentDate?.slice(0, 10)}.</p>}{invoice.disputed && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">Tranh chấp: {invoice.disputeReason}</p>}{invoice.disputeResolution && !invoice.disputed && <p className="mt-4 rounded-xl bg-page p-3 text-sm">Giải quyết: {invoice.disputeResolution}. Khách thuê cần xác nhận lại.</p>}{invoice.reminders.length > 0 && <p className="mt-4 text-xs text-muted">Đã nhắc {invoice.reminders.length} lần; gần nhất {invoice.reminders.at(-1)?.reminderDate}.</p>}{invoice.corrections.length > 0 && <details className="mt-3 text-sm"><summary className="cursor-pointer font-semibold text-primary">Lịch sử sửa · phiên bản {invoice.revision}</summary><ol className="mt-2 space-y-1 pl-4 text-muted">{invoice.corrections.map((entry) => <li key={entry.revision}>Lần {entry.revision}: {entry.reason} · {entry.correctedAt.slice(0, 10)}</li>)}</ol></details>}<div className="mt-6 flex flex-wrap gap-2">{!landlord && invoice.status === 'PENDING' && !invoice.disputed && <Button size="sm" onClick={() => onAction('confirm', invoice)}>Xác nhận hóa đơn</Button>}{!landlord && invoice.status !== 'PAID' && <Button size="sm" onClick={() => onPayVnpay(invoice)} className="bg-blue-600 hover:bg-blue-700 text-white">Thanh toán VNPAY</Button>}{!landlord && invoice.status !== 'PAID' && <Button size="sm" variant="outline" onClick={() => onAction('dispute', invoice)}>Tranh chấp</Button>}{landlord && invoice.status === 'CONFIRMED' && !invoice.disputed && <Button size="sm" onClick={() => onAction('pay', invoice)}>Ghi nhận đã thu</Button>}{landlord && invoice.disputed && <Button size="sm" onClick={() => onAction('resolve', invoice)}>Giải quyết tranh chấp</Button>}{landlord && invoice.status !== 'PAID' && <Button size="sm" variant="outline" onClick={() => onAction('correct', invoice)}>Sửa hóa đơn</Button>}{landlord && isInvoiceOverdue(invoice) && !invoice.reminders.some((item) => item.reminderDate === todayVN()) && <Button size="sm" variant="outline" onClick={() => onRemind(invoice)}>Nhắc thanh toán</Button>}</div></article>;
}

