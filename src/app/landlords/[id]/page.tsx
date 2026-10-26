'use client';

import { use } from 'react';
import Link from 'next/link';
import TenantShell from '@/components/layouts/TenantShell';
import { useCatalog } from '@/hooks/useCatalog';
import { formatVND } from '@/lib/utils';
import { findMockUserById } from '@/services/mock/auth';

// UC02.5 (mock): public landlord profile — name + approved posts only.
// Phone/email are intentionally NOT shown here: UC02.8 reserves contact
// details for the Contact Card, unlocked only on an ACCEPTED request.
// The backend has no public landlord endpoint yet, so this page reads the
// same mock catalog the search uses.
export default function LandlordProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const catalog = useCatalog();
  if (!catalog.ready) return <TenantShell><p role="status" className="p-8">Đang tải hồ sơ chủ trọ…</p></TenantShell>;
  const landlord = findMockUserById(id);
  const posts = catalog.items.filter((r) => r.landlordId === id && r.postStatus === 'APPROVED' && !r.detail.rented);
  if (!landlord || landlord.role !== 'LANDLORD') {
    return <TenantShell><div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6"><h1 className="text-2xl font-bold">Không tìm thấy chủ trọ</h1><Link href="/" className="mt-4 inline-block text-sm font-semibold text-primary">Về trang tìm phòng</Link></div></TenantShell>;
  }
  const initials = landlord.fullName.trim().split(/\s+/).slice(-2).map((p) => p[0]).join('').toUpperCase();
  return <TenantShell><div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
    <Link href="/" className="text-sm font-semibold text-primary">← Quay lại tìm phòng</Link>
    <div className="mt-5 flex items-center gap-4">
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xl font-bold text-primary">{initials}</span>
      <div><h1 className="text-2xl font-bold text-ink">{landlord.fullName}</h1><p className="text-sm text-muted">Chủ trọ · {posts.length} tin đang hiển thị</p></div>
    </div>
    <p className="mt-4 max-w-xl text-sm leading-6 text-muted">Để liên hệ chủ trọ, mở một tin đăng và gửi yêu cầu quan tâm. Thông tin liên hệ chỉ mở trong Contact Card sau khi yêu cầu được chấp nhận.</p>
    <h2 className="mt-8 text-xl font-bold">Các tin đăng của chủ trọ</h2>
    {posts.length ? <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {posts.map((post) => <Link key={post.detail.roomId} href={`/rooms/${post.detail.roomId}`} className="overflow-hidden rounded-2xl border border-line bg-white transition hover:border-primary/50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.detail.primaryImageUrl} alt={post.detail.title} className="aspect-[16/10] w-full object-cover" />
        <div className="p-4">
          <p className="truncate text-sm font-bold text-ink">{post.detail.title}</p>
          <p className="mt-1 truncate text-xs text-muted">{post.detail.houseName} · {post.detail.floorName} · Phòng {post.detail.roomNumber}</p>
          <p className="mt-2 text-sm font-bold">{formatVND(post.detail.rentalPrice)}<span className="font-normal text-muted">/tháng · {post.detail.area} m²</span></p>
        </div>
      </Link>)}
    </div> : <p className="mt-4 rounded-2xl border border-dashed border-line bg-page p-6 text-sm text-muted">Chủ trọ này hiện không có tin đăng đang hiển thị.</p>}
  </div></TenantShell>;
}
