'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { posts } from '@/lib/data';
import type { PostStatus } from '@/types';
import { cn, formatPriceShort, postStatusLabel } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

type Filter = PostStatus | 'ALL';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'DRAFT', label: postStatusLabel.DRAFT },
  { key: 'PENDING', label: postStatusLabel.PENDING },
  { key: 'APPROVED', label: postStatusLabel.APPROVED },
  { key: 'REJECTED', label: postStatusLabel.REJECTED },
  { key: 'HIDDEN', label: postStatusLabel.HIDDEN },
];

const postTone: Record<PostStatus, 'gray' | 'amber' | 'green' | 'red'> = {
  DRAFT: 'gray',
  PENDING: 'amber',
  APPROVED: 'green',
  REJECTED: 'red',
  HIDDEN: 'gray',
};

export default function BaiDangPage() {
  const [filter, setFilter] = useState<Filter>('ALL');
  const filtered = filter === 'ALL' ? posts : posts.filter((p) => p.status === filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold text-ink">Bài đăng</h1>
          <p className="mt-1 text-sm text-muted">{posts.length} bài đăng · Roomix Lê Văn Lương</p>
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
              'rounded-full border px-4 py-2 text-sm font-medium transition',
              filter === f.key
                ? 'border-primary bg-primary text-white'
                : 'border-line bg-white text-muted hover:border-primary hover:text-primary',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted">Chưa có bài đăng nào ở trạng thái này.</Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => (
            <Card key={post.id} className="flex items-center gap-4 p-4">
              <Image src={post.image} alt={post.title} width={224} height={168} className="h-[84px] w-28 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-ink">{post.title}</h3>
                <p className="mt-0.5 text-sm text-muted">Đăng {post.createdAt} · {post.views} lượt xem</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-bold text-ink">{formatPriceShort(post.price)}<span className="text-sm font-normal text-muted"> / tháng</span></p>
                <div className="mt-1.5">
                  <Badge tone={postTone[post.status]} dot>{postStatusLabel[post.status]}</Badge>
                </div>
              </div>
              <svg className="shrink-0 text-muted" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
