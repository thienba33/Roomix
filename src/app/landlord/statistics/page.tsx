import { expenseDonut, revenueBar, revenueLine } from '@/lib/data';
import Card from '@/components/ui/Card';
import { BarChart, DonutChart, LineChart } from '@/components/ui/Charts';

const KPIS = [
  { label: 'DOANH THU THÁNG', value: '84,5 tr', sub: '+12% tháng trước', subClassName: 'font-medium text-green-700', valueClassName: 'text-[30px]' },
  { label: 'ĐÃ THU', value: '76,2 tr', sub: '90% hóa đơn', subClassName: 'text-muted', valueClassName: 'text-[30px]' },
  { label: 'CHƯA THU', value: '8,3 tr', sub: '6 hóa đơn mở', subClassName: 'text-muted', valueClassName: 'text-[30px]' },
  { label: 'QUÁ HẠN', value: '2 hóa đơn', sub: 'Cần nhắc thu', subClassName: 'font-medium text-red-600', valueClassName: 'text-[26px]' },
];

const HOUSES = [
  { name: 'Lê Văn Lương', value: '52 tr', width: '100%' },
  { name: 'Cầu Giấy', value: '21 tr', width: '40%' },
  { name: 'Hà Đông', value: '11,5 tr', width: '22%' },
];

const EXPENSE_LABELS: Record<string, string> = {
  'Điện': 'Điện nước',
  'Nước': 'Bảo trì',
  'Khác': 'Khác',
};

export default function ThongKePage() {
  const total = expenseDonut.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Thống kê tài chính</h1>
        <p className="mt-1 text-sm text-muted">Năm 2026 · Tất cả các nhà</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{s.label}</p>
            <p className={`mt-2 font-extrabold leading-none text-ink ${s.valueClassName}`}>{s.value}</p>
            <p className={`mt-2 text-[13px] ${s.subClassName}`}>{s.sub}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold text-ink">Doanh thu theo tháng</h3>
          <div className="mt-3">
            <BarChart data={revenueBar} height={220} />
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold text-ink">Theo nhà</h3>
          <div className="mt-5 space-y-6">
            {HOUSES.map((h) => (
              <div key={h.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-ink">{h.name}</span>
                  <span className="font-semibold text-ink">{h.value}</span>
                </div>
                <div className="mt-2.5 h-2 rounded-full bg-[#F1F1F1]">
                  <div className="h-2 rounded-full bg-primary" style={{ width: h.width }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">AI NHẬN XÉT</p>
        <p className="mt-2 text-sm text-ink">Doanh thu tăng 12% nhờ lấp đầy 3 phòng trống trong tháng 9. Còn 5 phòng trống — đăng bài ngay để giữ đà.</p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold text-ink">Doanh thu 6 tháng</h3>
          <p className="mt-0.5 text-[13px] text-muted">triệu đồng</p>
          <div className="mt-3">
            <LineChart data={revenueLine} height={240} area />
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold text-ink">Cơ cấu chi phí</h3>
          <div className="mt-4 flex items-center gap-6">
            <DonutChart data={expenseDonut} size={110} hideLegend />
            <ul className="flex-1 space-y-3">
              {expenseDonut.map((d) => (
                <li key={d.label} className="flex items-center gap-2.5 text-sm">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color ?? '#4F46E5' }} />
                  <span className="text-ink">{`${EXPENSE_LABELS[d.label] ?? d.label} · ${Math.round((d.value / total) * 100)}%`}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
