'use client';

import Link from 'next/link';
import Card from '@/components/ui/Card';
import { LineChart } from '@/components/ui/Charts';
import { adminStats, userGrowth, postDonut, adminLandlords } from '@/lib/data';
import {
  pendingModerationCount,
  useAdminReports,
  useAdminUsers,
  useModerationDecisions,
} from '@/lib/admin-store';
import { cn } from '@/lib/utils';

/* Derived from mock data (adminLandlords) so the vacancy table stays data-driven */
const totalRooms = adminLandlords.reduce((s, l) => s + l.rooms, 0);
const vacantOf = (rooms: number, occupancy: number) => Math.round((rooms * (100 - occupancy)) / 100);
const totalVacant = adminLandlords.reduce((s, l) => s + vacantOf(l.rooms, l.occupancy), 0);
const vacantPct = totalRooms > 0 ? Math.round((totalVacant / totalRooms) * 100) : 0;

/* Line chart in the reference is labelled T1–T6; same growth series, relabelled */
const growthLine = userGrowth.map((d, i) => ({ ...d, label: `T${i + 1}` }));

const KPIS = [
  { label: 'Người dùng', value: adminStats.totalUsers.toLocaleString('vi-VN'), sub: '+18 tháng này' },
  { label: 'Chủ trọ', value: adminStats.totalLandlords.toLocaleString('vi-VN'), sub: 'Đang hoạt động' },
  { label: 'Phòng trọ', value: totalRooms.toLocaleString('vi-VN'), sub: `${adminLandlords.length} chủ trọ` },
  { label: 'Phòng trống', value: totalVacant.toLocaleString('vi-VN'), sub: `${vacantPct}% tổng số phòng` },
];

function PostDonut() {
  const total = postDonut.reduce((s, d) => s + d.value, 0) || 1;
  const r = 52;
  const c = 2 * Math.PI * r;
  let acc = 0;
  const arcs = postDonut.map((d) => {
    const frac = d.value / total;
    const arc = { dash: frac * c, offset: -acc * c, color: d.color };
    acc += frac;
    return arc;
  });
  const approved = postDonut[0];
  return (
    <div className="relative h-[128px] w-[128px] shrink-0">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#F1F1F1" strokeWidth="17" />
        {arcs.map((a, i) => (
          <circle
            key={i}
            cx="64"
            cy="64"
            r={r}
            fill="none"
            stroke={a.color}
            strokeWidth="17"
            strokeDasharray={`${Math.max(a.dash - 2, 0)} ${c}`}
            strokeDashoffset={a.offset}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[22px] font-extrabold leading-none text-ink">{approved.value}%</span>
        <span className="mt-1 text-[11px] text-muted">đã duyệt</span>
      </div>
    </div>
  );
}

// C2 · UC07.8 / UC07.5 — "Cần chú ý" counts are computed from the SAME admin
// store the queues use (moderation decisions, reports, users), so this strip
// can never disagree with C3/C5/C4; every item links to its queue, and the
// most urgent items (reports, then moderation) are visually prioritised.
export default function AdminDashboardPage() {
  const maxBar = Math.max(...userGrowth.map((d) => d.value), 1);
  const [decisions] = useModerationDecisions();
  const [reports] = useAdminReports();
  const [users] = useAdminUsers();

  const pendingPosts = pendingModerationCount(decisions);
  const pendingReports = reports.filter((r) => r.status === 'PENDING').length;
  const pendingVerifications = users.filter((u) => u.status === 'PENDING_VERIFICATION').length;

  const attention = [
    {
      href: '/admin/reports',
      count: pendingReports,
      label: 'báo cáo chưa xử lý',
      dot: 'bg-red-600',
      ring: 'border-red-200 bg-red-50 hover:border-red-300',
      priority: pendingReports > 0,
    },
    {
      href: '/admin/moderation',
      count: pendingPosts,
      label: 'bài chờ kiểm duyệt',
      dot: 'bg-amber-600',
      ring: 'border-amber-200 bg-amber-50 hover:border-amber-300',
      priority: pendingPosts > 0,
    },
    {
      href: '/admin/users?status=PENDING_VERIFICATION',
      count: pendingVerifications,
      label: 'chủ trọ chờ xác minh',
      dot: 'bg-primary',
      ring: 'border-line bg-white hover:border-primary/40',
      priority: false,
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[26px] font-extrabold tracking-tight text-ink">Dashboard hệ thống</h1>
        <p className="mt-1 text-sm text-muted">Toàn bộ Roomix · cập nhật hôm nay</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{k.label}</p>
            <p className="mt-2 text-[30px] font-extrabold leading-none text-ink">{k.value}</p>
            <p className="mt-2 text-[13px] font-medium text-green-600">{k.sub}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="text-[16px] font-bold text-ink">Người dùng mới 6 tháng</h2>
          <div className="mt-5 flex items-end gap-3" role="img" aria-label="Biểu đồ cột người dùng mới 6 tháng">
            {userGrowth.map((d) => (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-[108px] w-full items-end justify-center">
                  <div
                    className="w-full max-w-[34px] rounded-t-[6px] bg-primary"
                    style={{ height: `${(d.value / maxBar) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] text-muted">{d.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-[16px] font-bold text-ink">Người dùng mới</h2>
          <p className="text-xs text-muted">người / tháng</p>
          <div className="mt-2">
            <LineChart data={growthLine} height={168} area={false} />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-[16px] font-bold text-ink">Bài đăng</h2>
          <div className="mt-4 flex items-center gap-5">
            <PostDonut />
            <ul className="space-y-2.5">
              {postDonut.map((d) => (
                <li key={d.label} className="flex items-center gap-2 text-[13px] text-ink">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: d.color }} />
                  {d.label} · {d.value}%
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-4 text-xs text-muted">Theo trạng thái duyệt</p>
        </Card>
      </div>

      {/* Attention strip — live counts from the shared admin store, each item navigates to its queue */}
      <Card className="mt-6 p-5">
        <h2 className="text-[16px] font-bold text-ink">Cần chú ý</h2>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
          {attention.map((a) => (
            <Link
              key={a.href + a.label}
              href={a.href}
              className={cn(
                'flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm font-medium text-ink transition',
                a.ring,
                a.priority && 'font-semibold',
              )}
            >
              <span className={cn('h-2 w-2 shrink-0 rounded-full', a.dot)} />
              <span>
                <span className="font-extrabold">{a.count}</span> {a.label}
              </span>
              <span className="ml-auto text-muted" aria-hidden>→</span>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-6 overflow-hidden">
        <h2 className="px-5 pt-5 text-[16px] font-bold text-ink">Phòng trống theo chủ trọ</h2>
        <div className="mt-2 overflow-x-auto px-5 pb-3">
          <table className="w-full min-w-[640px] text-left text-sm">
            <tbody>
              {adminLandlords.map((l) => {
                const vacant = vacantOf(l.rooms, l.occupancy);
                return (
                  <tr key={l.id} className="border-b border-line last:border-0">
                    <td className="py-4 pr-4 font-medium text-ink">{l.name}</td>
                    <td className="py-4 pr-4 text-muted">{l.house}</td>
                    <td className="py-4 pr-4 text-muted">{l.rooms} phòng</td>
                    <td className={`py-4 text-right font-medium ${vacant > 0 ? 'text-green-600' : 'text-muted'}`}>
                      {vacant} trống
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
