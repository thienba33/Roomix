'use client';

import Link from 'next/link';
import { useAdminPosts } from '@/hooks/useAdminPosts';
import { useApiData } from '@/hooks/useApiData';
import { listUsers, USERS_EVENT, type AdminUser } from '@/services/backend/admin';
import { formatVND } from '@/lib/utils';
import { formatAdminDate } from '@/components/admin/presentation';

const EMPTY: AdminUser[] = [];
const pendingUsersHref = '/admin/users?role=LANDLORD&status=PENDING_VERIFICATION';

export default function AdminPage() {
  const catalog = useAdminPosts();
  const users = useApiData('users', listUsers, EMPTY, USERS_EVENT);
  if (!catalog.ready || !users.ready) return <p role="status">Đang tải tổng quan…</p>;
  if (catalog.error || users.error) return <p role="alert">{catalog.error || users.error}</p>;
  const posts = catalog.items.filter((item) => item.status === 'PENDING').sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const landlords = users.data.filter((user) => user.role === 'LANDLORD' && user.status === 'PENDING_VERIFICATION').sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return <section className="admin-overview space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold">Tổng quan</h1>
      <Link href="/admin/users" className="text-sm text-muted hover:text-primary">{users.data.length} tài khoản</Link>
    </header>
    <div className="admin-metrics grid sm:grid-cols-2">
      {[[posts.length, 'Tin chờ duyệt', '/admin/moderation'], [landlords.length, 'Chủ trọ chờ xác minh', pendingUsersHref]].map(([count, label, href]) => <Link key={label} href={String(href)} className="p-6"><span className="text-sm text-muted">{label}</span><strong className="mt-2 block text-3xl tabular-nums">{count}</strong></Link>)}
    </div>
    <div className="admin-overview-queues">
      <section aria-labelledby="pending-posts-heading" className="admin-work-queue">
        <header><h2 id="pending-posts-heading">Tin chờ duyệt</h2><Link href="/admin/moderation">Xem tất cả</Link></header>
        {posts.length ? posts.slice(0, 5).map((post) => <Link className="admin-work-item" key={post.id} href={`/admin/moderation/${post.id}`}>
          <span><strong>{post.title}</strong><span>{formatVND(post.rentalPrice)} / tháng</span></span><time dateTime={post.createdAt}>{formatAdminDate(post.createdAt)}</time>
        </Link>) : <p className="admin-queue-empty">Không có tin chờ duyệt.</p>}
      </section>
      <section aria-labelledby="pending-landlords-heading" className="admin-work-queue">
        <header><h2 id="pending-landlords-heading">Chủ trọ chờ xác minh</h2><Link href={pendingUsersHref}>Xem tất cả</Link></header>
        {landlords.length ? landlords.slice(0, 5).map((user) => <Link className="admin-work-item" key={user.id} href={`${pendingUsersHref}&search=${encodeURIComponent(user.username)}`}>
          <span><strong>{user.fullName}</strong><span>{user.email}</span></span><time dateTime={user.createdAt}>{formatAdminDate(user.createdAt)}</time>
        </Link>) : <p className="admin-queue-empty">Không có chủ trọ chờ xác minh.</p>}
      </section>
    </div>
  </section>;
}
