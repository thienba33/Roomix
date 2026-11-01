'use client';

import Link from 'next/link';
import { formatAdminDate } from '@/components/admin/presentation';
import { useApiData } from '@/hooks/useApiData';
import { formatVND } from '@/lib/utils';
import { ADMIN_DASHBOARD_EVENT, getAdminDashboard, type AdminDashboard } from '@/services/backend/admin';

const EMPTY_DASHBOARD: AdminDashboard = {
  totalUsers: 0, totalTenants: 0, totalLandlords: 0, activeUsers: 0, lockedUsers: 0,
  pendingLandlords: 0, totalRooms: 0, availableRooms: 0, rentedRooms: 0, approvedPosts: 0,
  pendingPostCount: 0, openReportCount: 0, unreadNotificationCount: 0,
  pendingPosts: [], pendingLandlordProfiles: [], openReports: [],
};
const pendingUsersHref = '/admin/users?role=LANDLORD&status=PENDING_VERIFICATION';

export default function AdminPage() {
  const dashboard = useApiData('admin-dashboard', getAdminDashboard, EMPTY_DASHBOARD, ADMIN_DASHBOARD_EVENT, 60_000);
  if (!dashboard.ready) return <p role="status">Đang tải tổng quan…</p>;
  if (dashboard.error) return <p role="alert">{dashboard.error}</p>;
  const data = dashboard.data;

  return <section className="admin-overview space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold">Tổng quan quản trị</h1><p className="mt-1 text-sm text-muted">{data.totalRooms} phòng · {data.approvedPosts} tin đang công khai</p></div>
      <Link href="/admin/users" className="text-sm text-muted hover:text-primary">{data.totalUsers} tài khoản</Link>
    </header>

    <div className="admin-metrics grid sm:grid-cols-3">
      {[[data.pendingPostCount, 'Tin chờ duyệt', '/admin/moderation'], [data.pendingLandlords, 'Chủ trọ chờ xác minh', pendingUsersHref], [data.openReportCount, 'Báo cáo cần xử lý', '/admin/reports']].map(([count, label, href]) =>
        <Link key={label} href={String(href)} className="p-6"><span className="text-sm text-muted">{label}</span><strong className="mt-2 block text-3xl tabular-nums">{count}</strong></Link>)}
    </div>

    <div className="grid gap-3 sm:grid-cols-4">
      {[[data.activeUsers, 'Tài khoản hoạt động'], [data.lockedUsers, 'Tài khoản bị khóa'], [data.availableRooms, 'Phòng còn trống'], [data.rentedRooms, 'Phòng đã thuê']].map(([value, label]) =>
        <div key={label} className="rounded-xl border border-line bg-white p-4"><strong className="block text-xl tabular-nums">{value}</strong><span className="text-sm text-muted">{label}</span></div>)}
    </div>

    <div className="admin-overview-queues">
      <section aria-labelledby="pending-posts-heading" className="admin-work-queue">
        <header><h2 id="pending-posts-heading">Tin chờ duyệt</h2><Link href="/admin/moderation">Xem tất cả</Link></header>
        {data.pendingPosts.length ? data.pendingPosts.map((post) => <Link className="admin-work-item" key={post.id} href={`/admin/moderation/${post.id}`}><span><strong>{post.title}</strong><span>{formatVND(post.rentalPrice)} / tháng</span></span><time dateTime={post.createdAt}>{formatAdminDate(post.createdAt)}</time></Link>) : <p className="admin-queue-empty">Không có tin chờ duyệt.</p>}
      </section>
      <section aria-labelledby="pending-landlords-heading" className="admin-work-queue">
        <header><h2 id="pending-landlords-heading">Chủ trọ chờ xác minh</h2><Link href={pendingUsersHref}>Xem tất cả</Link></header>
        {data.pendingLandlordProfiles.length ? data.pendingLandlordProfiles.map((user) => <Link className="admin-work-item" key={user.id} href={`${pendingUsersHref}&search=${encodeURIComponent(user.username)}`}><span><strong>{user.fullName}</strong><span>{user.email}</span></span><time dateTime={user.createdAt}>{formatAdminDate(user.createdAt)}</time></Link>) : <p className="admin-queue-empty">Không có chủ trọ chờ xác minh.</p>}
      </section>
      <section aria-labelledby="pending-reports-heading" className="admin-work-queue">
        <header><h2 id="pending-reports-heading">Báo cáo cần xử lý</h2><Link href="/admin/reports">Xem tất cả</Link></header>
        {data.openReports.length ? data.openReports.map((report) => <Link className="admin-work-item" key={report.id} href="/admin/reports"><span><strong>{report.reason}</strong><span>{report.targetType} #{report.targetId.slice(0, 8)}</span></span><time dateTime={report.createdAt}>{formatAdminDate(report.createdAt)}</time></Link>) : <p className="admin-queue-empty">Không có báo cáo cần xử lý.</p>}
      </section>
    </div>
  </section>;
}
