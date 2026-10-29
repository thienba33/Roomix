'use client';

import Link from 'next/link';
import { useRental } from '@/hooks/useRental';
import { useInvoices } from '@/hooks/useInvoices';
import { useRoomDetails } from '@/hooks/useRoomDetails';
import { isInvoiceOverdue, outstanding } from '@/services/backend/invoices';
import { formatVND } from '@/lib/utils';
import { hostDate } from '@/components/landlord/presentation';

export default function LandlordPage() {
  const rental = useRental();
  const invoices = useInvoices();
  const rooms = useRoomDetails([...rental.requests.map((item) => item.roomId), ...rental.tenancies.map((item) => item.roomId)]);
  const roomName = (id: string) => rooms.items.find((room) => room.roomId === id)?.title ?? (id ? `Phòng ${id}` : 'Hóa đơn thuê phòng');
  const requests = rental.requests.filter((item) => item.status === 'PENDING').sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const contracts = rental.tenancies.filter((item) => item.status === 'PENDING').sort((a, b) => a.depositDeadline.localeCompare(b.depositDeadline));
  const overdue = invoices.items.filter((item) => isInvoiceOverdue(item)).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return <section className="host-overview space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">Việc cần xử lý</h1><Link className="host-primary-link" href="/landlord/listings/create">Đăng phòng</Link></header>
    <div className="host-metrics grid sm:grid-cols-3">
      {[[rental.ready ? rental.error ? '—' : requests.length : '…', 'Yêu cầu chờ xử lý', '/landlord/requests?status=PENDING'], [rental.ready ? rental.error ? '—' : contracts.length : '…', 'Hợp đồng chờ cọc', '/landlord/tenants?status=PENDING'], [invoices.ready ? invoices.error ? '—' : overdue.length : '…', 'Hóa đơn quá hạn', '/landlord/invoices?status=OVERDUE']].map(([count, label, href]) => <Link key={label} href={String(href)}><span className="text-sm text-muted">{label}</span><strong className="mt-2 block text-3xl tabular-nums">{count}</strong></Link>)}
    </div>
    {rooms.error && <p role="alert" className="text-sm text-red-700">{rooms.error}</p>}
    <div className="host-dashboard-queues">
      <section className="host-work-queue" aria-labelledby="host-requests-heading"><header><h2 id="host-requests-heading">Yêu cầu chờ xử lý</h2><Link href="/landlord/requests?status=PENDING">Xem tất cả</Link></header>
        {!rental.ready ? <p className="host-queue-empty" role="status">Đang tải yêu cầu…</p> : rental.error ? <p className="host-queue-empty" role="alert">{rental.error}</p> : requests.length ? requests.slice(0, 5).map((item) => <Link className="host-work-item" key={item.id} href={`/landlord/requests?status=PENDING&record=${encodeURIComponent(item.id)}`}><span><strong>{roomName(item.roomId)}</strong><span className="line-clamp-2">{item.note || 'Không có lời nhắn'}</span></span><time dateTime={item.createdAt}>{hostDate(item.createdAt)}</time></Link>) : <p className="host-queue-empty">Không có yêu cầu đang chờ.</p>}
      </section>
      <section className="host-work-queue" aria-labelledby="host-contracts-heading"><header><h2 id="host-contracts-heading">Hợp đồng chờ cọc</h2><Link href="/landlord/tenants?status=PENDING">Xem tất cả</Link></header>
        {!rental.ready ? <p className="host-queue-empty" role="status">Đang tải hợp đồng…</p> : rental.error ? <p className="host-queue-empty" role="alert">{rental.error}</p> : contracts.length ? contracts.slice(0, 5).map((item) => <Link className="host-work-item" key={item.id} href={`/landlord/tenants?status=PENDING&record=${encodeURIComponent(item.id)}`}><span><strong>{roomName(item.roomId)}</strong><span>Cọc {formatVND(item.depositAmount)}</span></span><span className="host-work-date">Hạn cọc<time dateTime={item.depositDeadline}>{hostDate(item.depositDeadline, true)}</time></span></Link>) : <p className="host-queue-empty">Không có hợp đồng chờ cọc.</p>}
      </section>
      <section className="host-work-queue host-overdue-queue" aria-labelledby="host-overdue-heading"><header><h2 id="host-overdue-heading">Hóa đơn quá hạn</h2><Link href="/landlord/invoices?status=OVERDUE">Xem tất cả</Link></header>
        {!invoices.ready ? <p className="host-queue-empty" role="status">Đang tải hóa đơn…</p> : invoices.error ? <p className="host-queue-empty" role="alert">{invoices.error}</p> : overdue.length ? overdue.slice(0, 5).map((item) => <Link className="host-work-item" key={item.id} href={`/landlord/invoices?status=OVERDUE&invoice=${encodeURIComponent(item.id)}`}><span><strong>{roomName(rental.tenancies.find((contract) => contract.id === item.tenancyId)?.roomId ?? '')}</strong><span>Kỳ {item.billingMonth} · Hạn {hostDate(item.dueDate)}</span></span><strong className="text-sm text-red-700">{formatVND(outstanding(item))}</strong></Link>) : <p className="host-queue-empty">Không có hóa đơn quá hạn.</p>}
      </section>
    </div>
  </section>;
}
