'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { posts } from '@/lib/data';
import type { PostStatus } from '@/types';
import { cn, formatPriceShort, postStatusLabel } from '@/lib/utils';
import Card from '@/components/ui/Card';

type Filter = PostStatus | 'ALL';

// Figma B3 wording: APPROVED posts are shown as "Đang hiển thị", REJECTED as "Bị từ chối".
const listLabel: Record<PostStatus, string> = {
  ...postStatusLabel,
  APPROVED: 'Đang hiển thị',
  REJECTED: 'Bị từ chối',
};

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'APPROVED', label: listLabel.APPROVED },
  { key: 'PENDING', label: listLabel.PENDING },
  { key: 'DRAFT', label: listLabel.DRAFT },
  { key: 'REJECTED', label: listLabel.REJECTED },
  { key: 'HIDDEN', label: listLabel.HIDDEN },
];

const statusText: Record<PostStatus, string> = {
  APPROVED: 'text-green-700',
  PENDING: 'text-amber-700',
  DRAFT: 'text-gray-500',
  REJECTED: 'text-red-600',
  HIDDEN: 'text-gray-500',
};

export default function BaiDangPage() {
  const [filter, setFilter] = useState<Filter>('ALL');
  const filtered = filter === 'ALL' ? posts : posts.filter((p) => p.status === filter);
  const liveCount = posts.filter((p) => p.status === 'APPROVED').length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold text-ink">Bài đăng</h1>
          <p className="mt-1 text-sm text-muted">{posts.length} bài · {liveCount} đang hiển thị</p>
        </div>
        <Link
          href="/chu-tro/bai-dang/tao"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark"
        >
          + Tạo bài đăng
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'rounded-full px-4 py-2 text-sm transition',
              filter === f.key
                ? 'bg-primary-soft font-semibold text-primary-dark'
                : 'font-medium text-muted hover:bg-page hover:text-ink',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted">Chưa có bài đăng nào ở trạng thái này.</Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="hidden grid-cols-[1fr_130px_110px_130px] gap-4 border-b border-line/70 px-5 pb-3 pt-4 sm:grid">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Bài đăng</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Phòng</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Giá</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Trạng thái</span>
          </div>
          <div className="divide-y divide-line/70">
            {filtered.map((post) => (
              <div key={post.id} className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-3.5 sm:grid-cols-[1fr_130px_110px_130px]">
                <div className="flex min-w-0 items-center gap-3.5">
                  <Image src={post.image} alt={post.title} width={96} height={96} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-ink">{post.title}</h3>
                    <p className="mt-0.5 text-[13px] text-muted">Đăng {post.createdAt} · {post.views} lượt xem</p>
                  </div>
                </div>
                <span className="hidden text-sm text-muted sm:block">Phòng {post.roomCode}</span>
                <span className="hidden text-sm text-muted sm:block">{formatPriceShort(post.price)}</span>
                <span className={cn('text-sm font-semibold', statusText[post.status])}>{listLabel[post.status]}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
