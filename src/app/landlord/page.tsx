'use client';

import Link from 'next/link';
import { hostDate } from '@/components/landlord/presentation';
import { useApiData } from '@/hooks/useApiData';
import { useRoomDetails } from '@/hooks/useRoomDetails';
import { formatVND } from '@/lib/utils';
import { getLandlordDashboard, LANDLORD_DASHBOARD_EVENT, type LandlordDashboard } from '@/services/backend/rental';

const EMPTY_DASHBOARD: LandlordDashboard = {
  totalHouses: 0, totalRooms: 0, availableRooms: 0, occupiedRooms: 0, reservedRooms: 0,
  maintenanceRooms: 0, occupancyRate: 0, pendingRequestCount: 0, pendingTenancyCount: 0,
  activeTenancyCount: 0, overdueInvoiceCount: 0, outstandingAmount: 0,
  pendingRequests: [], pendingTenancies: [], overdueInvoices: [],
};

export default function LandlordPage() {
  const dashboard = useApiData('landlord-dashboard', getLandlordDashboard, EMPTY_DASHBOARD, LANDLORD_DASHBOARD_EVENT, 60_000);
  const roomIds = dashboard.ready ? [...dashboard.data.pendingRequests.map((item) => item.roomId), ...dashboard.data.pendingTenancies.map((item) => item.roomId)] : [];
  const rooms = useRoomDetails(roomIds, 'landlord');
  const roomName = (id: string) => rooms.items.find((room) => room.roomId === id)?.title ?? `Phòng ${id.slice(0, 8)}`;
  if (!dashboard.ready) return <p role="status">Đang tải tổng quan…</p>;
  if (dashboard.error) return <p role="alert">{dashboard.error}</p>;
  const data = dashboard.data;

  return <section className="host-overview space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold">Tổng quan chủ trọ</h1><p className="mt-1 text-sm text-muted">{data.totalHouses} nhà · {data.totalRooms} phòng · Công suất {data.occupancyRate}%</p></div>
      <div className="flex flex-wrap items-center gap-2"><Link href="/landlord/statistics" className="rounded-xl border border-line px-3.5 py-2 text-sm font-semibold text-secondary hover:border-primary">Báo cáo tài chính</Link><Link className="host-primary-link" href="/landlord/listings/create">Đăng phòng</Link></div>
    </header>

    <div className="host-metrics grid sm:grid-cols-3">
      {[[data.pendingRequestCount, 'Yêu cầu chờ xử lý', '/landlord/requests?status=PENDING'], [data.pendingTenancyCount, 'Hợp đồng chờ cọc', '/landlord/tenants?status=PENDING'], [data.overdueInvoiceCount, 'Hóa đơn quá hạn', '/landlord/invoices?status=OVERDUE']].map(([count, label, href]) => <Link key={label} href={String(href)}><span className="text-sm text-muted">{label}</span><strong className="mt-2 block text-3xl tabular-nums">{count}</strong></Link>)}
    </div>

    <div className="grid gap-3 sm:grid-cols-4">
      {[[data.availableRooms, 'Phòng còn trống'], [data.occupiedRooms, 'Phòng đang thuê'], [data.activeTenancyCount, 'Hợp đồng hoạt động'], [formatVND(data.outstandingAmount), 'Công nợ chưa thu']].map(([value, label]) => <div key={label} className="rounded-xl border border-line bg-white p-4"><strong className="block text-xl tabular-nums">{value}</strong><span className="text-sm text-muted">{label}</span></div>)}
    </div>

    {rooms.error && <p role="alert" className="text-sm text-red-700">{rooms.error}</p>}
    <div className="host-dashboard-queues">
      <section className="host-work-queue" aria-labelledby="host-requests-heading">
        <header><h2 id="host-requests-heading">Yêu cầu chờ xử lý</h2><Link href="/landlord/requests?status=PENDING">Xem tất cả</Link></header>
        {data.pendingRequests.length ? data.pendingRequests.map((item) => <Link className="host-work-item" key={item.id} href={`/landlord/requests?status=PENDING&record=${encodeURIComponent(item.id)}`}><span><strong>{roomName(item.roomId)}</strong><span className="line-clamp-2">{item.note || 'Không có lời nhắn'}</span></span><time dateTime={item.createdAt}>{hostDate(item.createdAt)}</time></Link>) : <p className="host-queue-empty">Không có yêu cầu đang chờ.</p>}
      </section>
      <section className="host-work-queue" aria-labelledby="host-contracts-heading">
        <header><h2 id="host-contracts-heading">Hợp đồng chờ cọc</h2><Link href="/landlord/tenants?status=PENDING">Xem tất cả</Link></header>
        {data.pendingTenancies.length ? data.pendingTenancies.map((item) => <Link className="host-work-item" key={item.id} href={`/landlord/tenants?status=PENDING&record=${encodeURIComponent(item.id)}`}><span><strong>{roomName(item.roomId)}</strong><span>Cọc {formatVND(item.depositAmount)}</span></span><span className="host-work-date">Hạn cọc<time dateTime={item.depositDeadline}>{hostDate(item.depositDeadline, true)}</time></span></Link>) : <p className="host-queue-empty">Không có hợp đồng chờ cọc.</p>}
      </section>
      <section className="host-work-queue host-overdue-queue" aria-labelledby="host-overdue-heading">
        <header><h2 id="host-overdue-heading">Hóa đơn quá hạn</h2><Link href="/landlord/invoices?status=OVERDUE">Xem tất cả</Link></header>
        {data.overdueInvoices.length ? data.overdueInvoices.map((item) => <Link className="host-work-item" key={item.id} href={`/landlord/invoices?status=OVERDUE&invoice=${encodeURIComponent(item.id)}`}><span><strong>{item.invoiceCode}</strong><span>Kỳ {item.billingMonth} · Hạn {hostDate(item.dueDate)}</span></span><strong className="text-sm text-red-700">{formatVND(item.outstandingAmount)}</strong></Link>) : <p className="host-queue-empty">Không có hóa đơn quá hạn.</p>}
      </section>
    </div>
  </section>;
}
