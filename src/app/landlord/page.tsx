'use client';
import Link from 'next/link';
import { useRental } from '@/hooks/useRental';
import { useCatalog } from '@/hooks/useCatalog';
import { useAuth } from '@/components/auth/AuthProvider';
import { landlordOverview } from '@/lib/landlord-overview';
import Card from '@/components/ui/Card';

const labels = { PENDING: 'Chờ xử lý', ACCEPTED: 'Đã chấp nhận', REJECTED: 'Đã từ chối', CANCELLED: 'Đã hủy' };
export default function LandlordHomePage() {
  const rental = useRental();
  const catalog = useCatalog();
  const { user } = useAuth();
  if (!rental.ready || !catalog.ready) return <p className="py-8 text-muted">Đang tải tổng quan…</p>;
  if (!user || user.role !== 'LANDLORD') return null;
  if (rental.error || catalog.error) return <p role="alert" className="py-8 text-red-600">{rental.error || catalog.error}</p>;
  const summary = landlordOverview(user.id, catalog.items, rental);
  const tasks = [
    { count: summary.pendingRequests, text: 'yêu cầu chờ xử lý', href: '/landlord/requests' },
    { count: summary.pendingDeposits, text: 'hợp đồng chờ cọc', href: '/landlord/tenants' },
    { count: summary.drafts, text: 'bài nháp', href: '/landlord/listings' },
    { count: summary.rejected, text: 'bài cần chỉnh sửa', href: '/landlord/listings' },
  ];
  return <div className="space-y-6">
    <div><h1 className="break-words text-2xl font-bold">Xin chào, {user.fullName}</h1><p className="mt-1 text-sm text-muted">Tổng quan phòng và hợp đồng của bạn</p></div>
    <Card className="p-5"><h2 className="font-bold">Cần xử lý</h2><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{tasks.map((task) => <Link key={task.text} href={task.href} className="rounded-xl bg-page p-4 text-sm hover:text-primary"><strong>{task.count}</strong> {task.text} →</Link>)}</div></Card>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[['Tổng phòng', summary.total], ['Đang thuê', summary.rented], ['Còn trống, chưa giữ cọc', summary.available], ['Hợp đồng chờ cọc', summary.pendingDeposits]].map(([label, value]) => <Card key={label} className="p-5"><p className="text-sm text-muted">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></Card>)}</div>
    <Card className="p-5"><h2 className="font-bold">Tỷ lệ lấp đầy</h2><p className="mt-3 text-sm text-muted">{summary.rented} / {summary.total} phòng đang thuê · {summary.occupancy}%</p><div role="meter" aria-label="Tỷ lệ lấp đầy" aria-valuemin={0} aria-valuemax={100} aria-valuenow={summary.occupancy} className="mt-3 h-3 overflow-hidden rounded-full bg-page"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${summary.occupancy}%` }} /></div></Card>
    <Card className="p-5"><div className="flex flex-wrap justify-between gap-2"><h2 className="font-bold">Yêu cầu cập nhật gần đây</h2><Link className="text-sm text-primary" href="/landlord/requests">Xem tất cả</Link></div>{summary.recent.length === 0 ? <p className="mt-4 text-sm text-muted">Chưa có yêu cầu thuê phòng.</p> : <ul className="mt-3 divide-y divide-line">{summary.recent.map((r) => <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div className="min-w-0"><p className="break-words font-medium">{r.title}</p><p className="mt-1 text-xs text-muted">{new Date(r.updatedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Bangkok' })}</p></div><span className="text-sm text-primary">{labels[r.status]}</span></li>)}</ul>}</Card>
  </div>;
}
