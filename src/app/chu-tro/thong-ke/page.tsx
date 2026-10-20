import { expenseDonut, revenueLine } from '@/lib/data';
import { formatVND } from '@/lib/utils';
import Card from '@/components/ui/Card';
import { DonutChart, LineChart } from '@/components/ui/Charts';

const STATS = [
  { label: 'DOANH THU THÁNG', value: '84,5 tr', sub: '+12% so với tháng trước' },
  { label: 'TỔNG THU NĂM', value: '612 tr', sub: 'Từ tháng 01/2026' },
  { label: 'CHI PHÍ THÁNG', value: '19,2 tr', sub: 'Điện, nước & vận hành' },
  { label: 'LỢI NHUẬN', value: '65,3 tr', sub: 'Doanh thu − chi phí' },
];

const TOTAL_COST = 19200000;

export default function ThongKePage() {
  const total = expenseDonut.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-extrabold text-ink">Thống kê</h1>
        <p className="mt-1 text-sm text-muted">Doanh thu và chi phí · Roomix Lê Văn Lương</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{s.label}</p>
            <p className="mt-2 text-[32px] font-extrabold leading-none text-ink">{s.value}</p>
            <p className="mt-2 text-[13px] font-medium text-muted">{s.sub}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-bold text-ink">Doanh thu 6 tháng</h3>
          <p className="mt-0.5 text-[13px] text-muted">triệu đồng</p>
          <div className="mt-3">
            <LineChart data={revenueLine} height={240} />
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-bold text-ink">Cơ cấu chi phí</h3>
          <p className="mt-0.5 text-[13px] text-muted">Tháng 10/2026</p>
          <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
            <DonutChart data={expenseDonut} size={160} />
            <ul className="w-full max-w-56 space-y-3">
              {expenseDonut.map((d) => (
                <li key={d.label} className="flex items-center gap-2.5 text-sm">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color ?? '#4F46E5' }} />
                  <span className="flex-1 text-ink">{d.label}</span>
                  <span className="font-semibold text-ink">{Math.round((d.value / total) * 100)}%</span>
                  <span className="w-24 text-right text-muted">{formatVND(Math.round((TOTAL_COST * d.value) / total))}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
