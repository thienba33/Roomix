'use client';
import Link from 'next/link';
import { useAdminPosts } from '@/hooks/useAdminPosts';
import { useApiData } from '@/hooks/useApiData';
import { listUsers, USERS_EVENT, type AdminUser } from '@/services/backend/admin';
const EMPTY: AdminUser[] = [];
export default function AdminPage() {
  const catalog = useAdminPosts();
  const users = useApiData('users', listUsers, EMPTY, USERS_EVENT);
  if (!catalog.ready || !users.ready) return <p role="status">Đang tải tổng quan…</p>;
  if (catalog.error || users.error) return <p role="alert">{catalog.error || users.error}</p>;
  const metrics = [['Khách thuê và chủ trọ', users.data.length, '/admin/users'], ['Chủ trọ chờ duyệt', users.data.filter((user) => user.role === 'LANDLORD' && user.status === 'PENDING_VERIFICATION').length, '/admin/users'], ['Tin chờ duyệt', catalog.items.filter((item) => item.status === 'PENDING').length, '/admin/moderation']] as const;
  return <section className="space-y-6"><h1 className="text-2xl font-bold">Tổng quan quản trị</h1><div className="grid gap-4 sm:grid-cols-3">{metrics.map(([label, count, href]) => <Link key={label} href={href} className="rounded-2xl border border-line p-6 hover:border-primary"><p className="text-sm text-muted">{label}</p><strong className="mt-3 block text-3xl">{count}</strong></Link>)}</div><p className="text-sm text-muted">Thống kê phòng trống toàn hệ thống và lịch sử hoạt động hiện chưa được hỗ trợ.</p></section>;
}
