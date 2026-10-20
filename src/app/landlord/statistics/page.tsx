'use client';
import { useMemo, useState } from 'react';
import { expenseDonut, revenueBar, revenueLine, invoices as seedInv } from '@/lib/data';
import { useInvoicesState, isOverdue } from '@/lib/landlord-store';
import { formatVND } from '@/lib/utils';
import Card from '@/components/ui/Card';
import { BarChart, DonutChart, LineChart } from '@/components/ui/Charts';

const HOUSES = [
  { name: 'Lê Văn Lương', value: '52 tr', width: '100%' }, { name: 'Cầu Giấy', value: '21 tr', width: '40%' }, { name: 'Hà Đông', value: '11,5 tr', width: '22%' },
];
const EXPENSE_LABELS: Record<string, string> = { 'Điện': 'Điện nước', 'Nước': 'Bảo trì', 'Khác': 'Khác' };
const PERIODS = ['Tháng 10/2026', 'Tháng 9/2026', 'Quý 4/2026', 'Năm 2026'] as const;
// Mock scaling per period so selector visibly changes the derived view (no stats endpoint in backend)
const PERIOD_FACTOR: Record<string, number> = { 'Tháng 10/2026': 1, 'Tháng 9/2026': 0.92, 'Quý 4/2026': 2.8, 'Năm 2026': 9.6 };

export default function ThongKePage() {
  const [invState] = useInvoicesState();
  const invoices = invState.length ? invState : seedInv;
  const [period, setPeriod] = useState<string>('Tháng 10/2026');
  const [houseFilter, setHouseFilter] = useState('Tất cả các nhà');
  const factor = PERIOD_FACTOR[period] ?? 1;

  const derived = useMemo(() => {
    const total = invoices.reduce((s, i) => s + i.total, 0);
    const paid = invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.total, 0);
    const open = invoices.filter((i) => i.status !== 'PAID');
    const overdue = invoices.filter((i) => isOverdue(i as never));
    return { total, paid, openAmount: open.reduce((s, i) => s + i.total, 0), openCount: open.length, overdueCount: overdue.length };
  }, [invoices]);

  const kpis = [
    { label: 'DOANH THU KỲ', value: formatVND(Math.round(derived.total * factor)), sub: `Từ ${invoices.length} hóa đơn (mock-derived)`, cls: 'text-muted', vc: 'text-[22px]' },
    { label: 'ĐÃ THU', value: formatVND(Math.round(derived.paid * factor)), sub: invoices.length ? `${Math.round((derived.paid / (derived.total || 1)) * 100)}% hóa đơn` : '—', cls: 'text-muted', vc: 'text-[22px]' },
    { label: 'CHƯA THU', value: formatVND(Math.round(derived.openAmount * factor)), sub: `${derived.openCount} hóa đơn mở`, cls: 'text-muted', vc: 'text-[22px]' },
    { label: 'QUÁ HẠN', value: `${derived.overdueCount} hóa đơn`, sub: 'Cần nhắc thu · tính từ hạn thanh toán', cls: 'font-medium text-red-600', vc: 'text-[26px]' },
  ];
  const total = expenseDonut.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-2xl font-semibold text-ink">Thống kê tài chính</h1><p className="mt-1 text-sm text-muted">{period} · {houseFilter} · Số liệu suy ra từ danh sách hóa đơn (backend chưa có endpoint thống kê — UC05.10)</p></div>
        <div className="flex gap-2">
          <select value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Kỳ thống kê" className="h-10 rounded-full border border-line px-3 text-sm outline-none focus:border-primary">{PERIODS.map((p) => <option key={p}>{p}</option>)}</select>
          <select value={houseFilter} onChange={(e) => setHouseFilter(e.target.value)} aria-label="Nhà" className="h-10 rounded-full border border-line px-3 text-sm outline-none focus:border-primary"><option>Tất cả các nhà</option><option>Lê Văn Lương</option><option>Cầu Giấy</option><option>Hà Đông</option></select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{kpis.map((s) => (<Card key={s.label} className="p-5"><p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{s.label}</p><p className={`mt-2 font-extrabold leading-none text-ink ${s.vc}`}>{s.value}</p><p className={`mt-2 text-[13px] ${s.cls}`}>{s.sub}</p></Card>))}</div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5"><h3 className="font-semibold text-ink">Doanh thu theo tháng</h3><div className="mt-3"><BarChart data={revenueBar} height={220} /></div></Card>
        <Card className="p-5"><h3 className="font-semibold text-ink">Theo nhà</h3><div className="mt-5 space-y-6">{HOUSES.map((h) => (<div key={h.name}><div className="flex items-center justify-between text-sm"><span className="font-medium text-ink">{h.name}</span><span className="font-semibold text-ink">{h.value}</span></div><div className="mt-2.5 h-2 rounded-full bg-[#F1F1F1]"><div className="h-2 rounded-full bg-primary" style={{ width: h.width }} /></div></div>))}</div></Card>
      </div>
      <Card className="p-5"><p className="text-[11px] font-semibold uppercase tracking-wider text-muted">AI NHẬN XÉT</p><p className="mt-2 text-sm text-ink">Doanh thu tăng 12% nhờ lấp đầy 3 phòng trống trong tháng 9. Còn 5 phòng trống — đăng bài ngay để giữ đà.</p></Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5"><h3 className="font-semibold text-ink">Doanh thu 6 tháng</h3><p className="mt-0.5 text-[13px] text-muted">triệu đồng</p><div className="mt-3"><LineChart data={revenueLine} height={240} area /></div></Card>
        <Card className="p-5"><h3 className="font-semibold text-ink">Cơ cấu chi phí</h3><div className="mt-4 flex items-center gap-6"><DonutChart data={expenseDonut} size={110} hideLegend /><ul className="flex-1 space-y-3">{expenseDonut.map((d) => (<li key={d.label} className="flex items-center gap-2.5 text-sm"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color ?? '#4F46E5' }} /><span className="text-ink">{`${EXPENSE_LABELS[d.label] ?? d.label} · ${Math.round((d.value / total) * 100)}%`}</span></li>))}</ul></div><p className="mt-3 text-[12px] text-muted">Cơ cấu chi phí là dữ liệu minh họa — hóa đơn backend chỉ có khoản thu (rent/electricity/water).</p></Card>
      </div>
    </div>
  );
}
