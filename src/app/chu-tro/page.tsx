import { activities, occupancyDonut, revenueBar, revenueLine, stats } from '@/lib/data';
import Card from '@/components/ui/Card';
import { BarChart, DonutChart, LineChart } from '@/components/ui/Charts';

const KPIS = [
  { label: 'TỔNG PHÒNG', value: String(stats.totalRooms), sub: '+2 phòng mới' },
  { label: 'ĐANG THUÊ', value: String(stats.rented), sub: `Lấp đầy ${stats.occupancy}%` },
  { label: 'CÒN TRỐNG', value: String(stats.empty), sub: 'Sẵn sàng đăng bài' },
  { label: 'DOANH THU THÁNG', value: '84,5 tr', sub: '+12% tháng trước' },
];

const TODO_ITEMS = [
  { dot: 'bg-amber-600', text: '3 yêu cầu quan tâm mới' },
  { dot: 'bg-red-600', text: '2 hóa đơn quá hạn' },
  { dot: 'bg-primary', text: '1 bài đăng chờ gửi duyệt' },
  { dot: 'bg-green-600', text: 'Ghi chỉ số điện tháng 10' },
];

const toneText: Record<string, string> = {
  green: 'text-green-700',
  red: 'text-red-600',
  amber: 'text-amber-700',
  indigo: 'text-primary',
};

export default function ChuTroHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-extrabold text-ink">Xin chào, Nguyễn Văn An</h1>
        <p className="mt-1 text-sm text-muted">Tổng quan · Roomix Lê Văn Lương</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{k.label}</p>
            <p className="mt-2 text-[32px] font-extrabold leading-none text-ink">{k.value}</p>
            <p className="mt-2 text-[13px] font-medium text-green-600">{k.sub}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h3 className="font-bold text-ink">Doanh thu 6 tháng</h3>
          <p className="mt-0.5 text-[13px] text-muted">triệu đồng</p>
          <div className="mt-3">
            <BarChart data={revenueBar} />
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-bold text-ink">Xu hướng doanh thu</h3>
          <p className="mt-0.5 text-[13px] text-muted">triệu đồng</p>
          <div className="mt-3">
            <LineChart data={revenueLine} />
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-bold text-ink">Tỷ lệ lấp đầy</h3>
          <div className="mt-3">
            <DonutChart data={occupancyDonut} centerLabel="82%" centerSub="29 / 36 phòng đang thuê" />
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-bold text-ink">Cần xử lý</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TODO_ITEMS.map((item) => (
            <div key={item.text} className="flex items-center gap-2.5 text-sm font-medium text-ink">
              <span className={`h-2 w-2 shrink-0 rounded-full ${item.dot}`} />
              {item.text}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-bold text-ink">Hoạt động gần đây</h3>
        <div className="mt-2 divide-y divide-line/70">
          {activities.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3.5">
              <span className="w-28 shrink-0 font-semibold text-ink">{a.room}</span>
              <span className="min-w-40 flex-1 text-sm text-muted">{a.text}</span>
              <span className="w-28 text-sm text-muted">{a.date}</span>
              <span className={`w-24 text-right text-sm font-semibold ${toneText[a.tone]}`}>{a.statusLabel}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
