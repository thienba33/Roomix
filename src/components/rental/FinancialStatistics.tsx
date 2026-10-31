'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useRoomDetails } from '@/hooks/useRoomDetails';
import { useFinancialInvoices } from '@/hooks/useInvoices';
import { useRental } from '@/hooks/useRental';
import { monthsForPeriod, summarizeFinances, UNKNOWN_HOUSE, type FinancePeriod, type FinanceSummary } from '@/lib/financial-statistics';
import { formatVND } from '@/lib/utils';
import { type RoomDetail } from '@/services/backend/rooms';
import { todayVN } from '@/services/backend/rental';

const controlClass = 'h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20';
const periodLabels: Record<FinancePeriod, string> = { month: 'Tháng', quarter: 'Quý', year: 'Năm' };
const monthLabel = (month: string) => {
  const [year, value] = month.split('-');
  return `T${Number(value)}/${year}`;
};
function periodTitle(months: string[], period: FinancePeriod) {
  if (!months.length) return 'Khoảng thời gian chưa hợp lệ';
  const [year, month] = months[0].split('-').map(Number);
  return period === 'year' ? `Năm ${year}` : period === 'quarter' ? `Quý ${Math.floor((month - 1) / 3) + 1}/${year}` : `Tháng ${String(month).padStart(2, '0')}/${year}`;
}
function houseOptions(rooms: RoomDetail[], tenancyRoomIds: string[]) {
  const options = new Map<string, string>();
  const owned = rooms.filter((room) => tenancyRoomIds.includes(room.roomId));
  owned.forEach((room) => options.set(room.houseId, room.houseName));
  const knownRoomIds = new Set(owned.map((room) => room.roomId));
  if (tenancyRoomIds.some((id) => !knownRoomIds.has(id))) options.set(UNKNOWN_HOUSE, 'Chưa xác định nhà');
  return [...options].sort((a, b) => a[1].localeCompare(b[1], 'vi'));
}

export default function FinancialStatistics() {
  const { user, ready: authReady } = useAuth();
  const rental = useRental();
  const catalog = useRoomDetails(
    [...rental.requests.map((item) => item.roomId), ...rental.tenancies.map((item) => item.roomId)],
    'landlord',
  );
  const invoices = useFinancialInvoices();
  if (!authReady || !catalog.ready || !rental.ready || !invoices.ready) return <div role="status" className="space-y-5"><h1 className="text-[28px] font-extrabold">Thống kê tài chính</h1><p className="text-muted">Đang tổng hợp hóa đơn…</p><div aria-hidden="true" className="h-52 animate-pulse rounded-2xl bg-page" /></div>;
  if (user?.role !== 'LANDLORD') return <p role="alert">Bạn cần đăng nhập bằng tài khoản chủ trọ để xem thống kê tài chính.</p>;
  return <Dashboard key={user.id} landlordId={user.id} rooms={catalog.items} tenancies={rental.tenancies} invoices={invoices.items} error={catalog.error || rental.error || invoices.error} />;
}

function Dashboard({ landlordId, rooms, tenancies, invoices, error }: {
  landlordId: string;
  rooms: RoomDetail[];
  tenancies: ReturnType<typeof useRental>['tenancies'];
  invoices: ReturnType<typeof useFinancialInvoices>['items'];
  error: string;
}) {
  const [anchor, setAnchor] = useState(() => todayVN().slice(0, 7));
  const [period, setPeriod] = useState<FinancePeriod>('month');
  const [houseChoice, setHouseChoice] = useState('');
  const months = monthsForPeriod(anchor, period);
  const ownedTenancies = tenancies.filter((item) => item.landlordId === landlordId);
  const houses = houseOptions(rooms, ownedTenancies.map((item) => item.roomId));
  const selectedHouse = houses.some(([id]) => id === houseChoice) ? houseChoice : '';
  const summary = summarizeFinances({ invoices, tenancies: ownedTenancies, rooms, landlordId, months, houseId: selectedHouse, today: todayVN() });
  const title = periodTitle(months, period);
  const houseLabel = houses.find(([id]) => id === selectedHouse)?.[1] ?? 'Tất cả các nhà';

  return <div className="host-finance space-y-6 pb-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-[28px] font-extrabold tracking-tight text-ink sm:text-[32px]">Thống kê tài chính</h1></div><Link href="/landlord/invoices" className="inline-flex h-11 items-center rounded-xl border border-line px-4 text-sm font-semibold text-primary hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-primary">Xem hóa đơn</Link></header>
    <section aria-label="Bộ lọc thống kê" className="grid gap-3 rounded-2xl border border-line bg-page p-4 sm:grid-cols-3 sm:p-5">
      <label className="space-y-1.5 text-xs font-semibold text-muted">Khoảng thời gian<select className={controlClass} value={period} onChange={(event) => setPeriod(event.target.value as FinancePeriod)}>{(Object.keys(periodLabels) as FinancePeriod[]).map((key) => <option key={key} value={key}>{periodLabels[key]}</option>)}</select></label>
      <label className="space-y-1.5 text-xs font-semibold text-muted">Tháng tham chiếu<input className={controlClass} type="month" value={anchor} onChange={(event) => setAnchor(event.target.value)} /></label>
      <label className="space-y-1.5 text-xs font-semibold text-muted">Nhà<select className={controlClass} value={selectedHouse} onChange={(event) => setHouseChoice(event.target.value)}><option value="">Tất cả các nhà</option>{houses.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
    </section>
    {error ? <Card role="alert" className="border-red-200 bg-red-50 p-6"><h2 className="font-bold">Chưa thể tổng hợp hóa đơn</h2><p className="mt-2 text-sm">{error}</p><Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Tải lại trang</Button></Card> : <>
      <p className="text-sm font-medium text-muted">{title} · {houseLabel}</p>
      {summary.invalidInvoiceCount || summary.missingPaymentDateCount ? <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Dữ liệu chưa đầy đủ: {summary.invalidInvoiceCount ? `${summary.invalidInvoiceCount} hóa đơn không hợp lệ. ` : ''}{summary.missingPaymentDateCount ? `${summary.missingPaymentDateCount} hóa đơn đã thu thiếu ngày thanh toán, chưa tính vào thực thu.` : ''}</p> : null}
      {!months.length ? <Card role="alert" className="p-6 text-sm">Chọn tháng hợp lệ để xem thống kê.</Card> : <>
        <section aria-label="Số liệu tài chính" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Phải thu của kỳ" value={summary.billed} detail={`${summary.invoiceCount} hóa đơn thuộc ${title.toLowerCase()}`} />
          <Metric label="Đã thu từ hóa đơn kỳ" value={summary.collectedForBills} detail="Số tiền đã ghi nhận trên các hóa đơn của kỳ" />
          <Metric label="Chưa thu của kỳ" value={summary.outstanding} detail={summary.overdueCount ? `${summary.overdueCount} hóa đơn quá hạn còn phải thu` : 'Không có hóa đơn quá hạn còn phải thu'} tone="amber" />
          <Metric label="Thực thu trong kỳ" value={summary.revenue} detail="Theo ngày chủ trọ ghi nhận thanh toán" tone="indigo" />
        </section>
        {summary.invoiceCount === 0 && summary.revenue === 0 ? <Card className="px-6 py-12 text-center"><h2 className="text-lg font-bold">Chưa có dữ liệu tài chính trong khoảng này</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">Chọn thời gian hoặc nhà khác. Khi có hóa đơn và thanh toán, số liệu sẽ xuất hiện ở đây.</p><Link href="/landlord/invoices" className="mt-5 inline-block text-sm font-semibold text-primary hover:underline">Xem hóa đơn của tôi</Link></Card> : <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]"><RevenueChart summary={summary} title={title} /><HouseBreakdown summary={summary} /></div>}
        <details className="text-xs leading-5 text-muted"><summary className="cursor-pointer font-semibold text-primary">Cách tính số liệu</summary><p className="mt-2">Khoản phải thu được nhóm theo kỳ hóa đơn. Thực thu được nhóm theo ngày ghi nhận thanh toán trực tiếp (tiền mặt/chuyển khoản), chưa gồm bù trừ quyết toán; vì vậy hai số có thể khác nhau trong cùng khoảng thời gian.</p></details>
      </>}
    </>}
  </div>;
}

function Metric({ label, value, detail, tone }: { label: string; value: number; detail: string; tone?: 'amber' | 'indigo' }) {
  return <Card className="min-w-0 p-5"><p className="text-xs font-medium text-muted">{label}</p><p className={`mt-3 break-words text-[25px] font-extrabold tracking-tight ${tone === 'amber' ? 'text-amber-700' : tone === 'indigo' ? 'text-primary' : 'text-ink'}`}>{formatVND(value)}</p><p className="mt-2 text-xs leading-5 text-muted">{detail}</p></Card>;
}
function RevenueChart({ summary, title }: { summary: FinanceSummary; title: string }) {
  const max = Math.max(1, ...summary.monthlyRevenue.map((row) => row.amount));
  return <Card className="min-w-0 p-5 sm:p-6">
    <h2 className="text-base font-bold">Tiền thực thu theo tháng</h2>
    <p className="mt-1 text-xs text-muted">{title} · theo ngày ghi nhận thanh toán</p>
    <p className="mt-3 text-xs text-muted">Đơn vị biểu đồ: triệu đồng</p>
    <div className="mt-5 flex h-48 items-end gap-1 border-b border-line pb-2 sm:gap-2" role="img"
      aria-label={summary.monthlyRevenue.map((row) => `${monthLabel(row.month)}: ${formatVND(row.amount)}`).join(', ')}>
      {summary.monthlyRevenue.map((row) => <div key={row.month} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
        <span className="max-w-full truncate text-[10px] font-semibold text-primary" title={formatVND(row.amount)}>
          {row.amount > 0 && row.amount < 10000 ? '<0,01' : (row.amount / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}
        </span>
        <div className="w-full max-w-12 rounded-t-md bg-primary" style={{ height: `${row.amount / max * 80}%` }} />
      </div>)}
    </div>
    <div className="mt-2 flex gap-1 sm:gap-2" aria-hidden="true">
      {summary.monthlyRevenue.map((row) => <span key={row.month} className="min-w-0 flex-1 text-center text-[10px] text-muted">T{Number(row.month.slice(5))}</span>)}
    </div>
    <details className="mt-5 border-t border-line pt-3 text-sm">
      <summary className="cursor-pointer rounded font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Xem số tiền từng tháng</summary>
      <table className="mt-3 w-full text-left text-xs">
        <caption className="sr-only">Số tiền thực thu từng tháng, đơn vị đồng</caption>
        <thead><tr className="border-b border-line text-muted"><th scope="col" className="py-2 font-medium">Tháng</th><th scope="col" className="py-2 text-right font-medium">Thực thu</th></tr></thead>
        <tbody>{summary.monthlyRevenue.map((row) => <tr key={row.month} className="border-b border-line last:border-0"><th scope="row" className="py-2 font-medium">{monthLabel(row.month)}</th><td className="py-2 text-right tabular-nums">{formatVND(row.amount)}</td></tr>)}</tbody>
      </table>
    </details>
  </Card>;
}
function HouseBreakdown({ summary }: { summary: FinanceSummary }) {
  return <Card className="min-w-0 p-5 sm:p-6"><h2 className="text-base font-bold">Đối chiếu theo nhà</h2>{summary.houses.length ? <div className="mt-5 overflow-x-auto"><table className="host-finance-table"><caption className="sr-only">Khoản phải thu và tiền đã thu theo nhà</caption><thead><tr><th>Nhà</th><th>Phải thu</th><th>Đã thu</th><th>Còn lại</th></tr></thead><tbody>{summary.houses.map((house) => <tr key={house.id}><th scope="row">{house.name}<span className="mt-1 block text-xs font-normal text-muted">{house.invoiceCount} hóa đơn</span></th><td>{formatVND(house.billed)}</td><td>{formatVND(house.collected)}</td><td>{formatVND(house.outstanding)}</td></tr>)}</tbody></table></div> : <p className="mt-6 text-sm text-muted">Không có hóa đơn thuộc kỳ đã chọn.</p>}</Card>;
}
