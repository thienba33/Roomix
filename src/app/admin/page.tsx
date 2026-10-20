import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { LineChart, DonutChart } from '@/components/ui/Charts';
import { adminStats, userGrowth, postDonut, adminLandlords } from '@/lib/data';
import { formatVND } from '@/lib/utils';

const KPIS = [
  { label: 'Tổng người dùng', value: String(adminStats.totalUsers), sub: '+18 tháng này', subTone: 'text-green-600' },
  { label: 'Chủ trọ', value: String(adminStats.totalLandlords), sub: 'Đang hoạt động', subTone: 'text-muted' },
  { label: 'Bài đăng', value: String(adminStats.totalPosts), sub: 'Toàn hệ thống', subTone: 'text-muted' },
  { label: 'Chờ duyệt', value: String(adminStats.pendingPosts), sub: 'Cần kiểm duyệt', subTone: 'text-amber-600', amber: true },
];

export default function AdminDashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[26px] font-extrabold tracking-tight text-ink">Tổng quan hệ thống</h1>
        <p className="mt-1 text-sm text-muted">Toàn bộ Roomix · cập nhật hôm nay</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">{k.label}</p>
            <p className="mt-2 text-[32px] font-extrabold leading-none text-ink">
              {k.value}
              {k.amber && (
                <span className="ml-2 inline-block h-2.5 w-2.5 rounded-full bg-amber-500 align-middle" aria-hidden />
              )}
            </p>
            <p className={`mt-2 text-[13px] font-medium ${k.subTone}`}>{k.sub}</p>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="mt-4 flex flex-col gap-4 lg:flex-row">
        <Card className="flex-[2] p-5">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-ink">Người dùng mới</h2>
              <p className="text-xs text-muted">người / tháng</p>
            </div>
            <Badge tone="indigo">6 tháng gần nhất</Badge>
          </div>
          <LineChart data={userGrowth} height={200} />
        </Card>

        <Card className="flex-1 p-5">
          <h2 className="text-base font-bold text-ink">Bài đăng</h2>
          <p className="mb-3 text-xs text-muted">Theo trạng thái duyệt</p>
          <DonutChart data={postDonut} centerLabel="186" centerSub="bài đăng" size={168} />
          <div className="mt-2 space-y-1.5 border-t border-line pt-3">
            <p className="flex items-center justify-between text-[13px]"><span className="flex items-center gap-2 text-muted"><span className="h-2 w-2 rounded-full bg-green-600" />Đã duyệt</span><span className="font-semibold text-ink">68%</span></p>
            <p className="flex items-center justify-between text-[13px]"><span className="flex items-center gap-2 text-muted"><span className="h-2 w-2 rounded-full bg-amber-500" />Chờ duyệt</span><span className="font-semibold text-ink">22%</span></p>
            <p className="flex items-center justify-between text-[13px]"><span className="flex items-center gap-2 text-muted"><span className="h-2 w-2 rounded-full bg-red-600" />Từ chối</span><span className="font-semibold text-ink">10%</span></p>
          </div>
        </Card>
      </div>

      {/* Top landlords */}
      <Card className="mt-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="text-base font-bold text-ink">Chủ trọ nổi bật</h2>
          <span className="text-xs text-muted">Theo doanh thu tháng này</span>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-y border-line bg-page text-xs uppercase tracking-wider text-muted">
                <th className="px-5 py-3 font-semibold">Chủ trọ</th>
                <th className="px-5 py-3 font-semibold">Nhà</th>
                <th className="px-5 py-3 font-semibold">Phòng</th>
                <th className="px-5 py-3 font-semibold">Lấp đầy</th>
                <th className="px-5 py-3 text-right font-semibold">Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {adminLandlords.map((l) => (
                <tr key={l.id} className="border-b border-line last:border-0 hover:bg-page/60">
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary-dark">
                        {l.name.split(' ').map((w) => w[0]).slice(-2).join('')}
                      </span>
                      <span className="font-semibold text-ink">{l.name}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-muted">{l.house}</td>
                  <td className="px-5 py-3.5 text-ink">{l.rooms} phòng</td>
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-primary-soft">
                        <span className="block h-full rounded-full bg-primary" style={{ width: `${l.occupancy}%` }} />
                      </span>
                      <span className="font-medium text-ink">{l.occupancy}%</span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-ink">{formatVND(l.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
