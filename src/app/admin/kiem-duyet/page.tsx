'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { moderationQueue } from '@/lib/data';
import { cn, formatVND, postStatusLabel } from '@/lib/utils';
import type { Post, PostStatus } from '@/types';

type QueueItem = Post & { localStatus: PostStatus };

const QUICK_CHECKS = [
  'Ảnh thật, rõ nét',
  'Giá khớp mặt bằng khu vực',
  'Địa chỉ hợp lệ',
  'Không dấu hiệu lừa đảo',
];

function landlordFor(post: Post): string {
  // Map roomId → landlord display name (sample data aligned with Figma)
  const map: Record<number, string> = {
    302: 'Nguyễn Văn An',
    405: 'Trần Thu Hằng',
    510: 'Lê Minh Đức',
    102: 'Nguyễn Văn An',
    303: 'Nguyễn Văn An',
    201: 'Trần Thị Mai',
  };
  return map[post.roomId] ?? 'Chủ trọ Roomix';
}

function StatusBadge({ status }: { status: PostStatus }) {
  if (status === 'PENDING') return <Badge tone="amber" dot>Chờ duyệt</Badge>;
  if (status === 'APPROVED') return <Badge tone="green" dot>Đã duyệt</Badge>;
  if (status === 'REJECTED') return <Badge tone="red" dot>Từ chối</Badge>;
  return <Badge tone="gray" dot>{postStatusLabel[status]}</Badge>;
}

export default function ModerationPage() {
  const [items, setItems] = useState<QueueItem[]>(
    () => moderationQueue.map((p) => ({ ...p, localStatus: p.status })),
  );
  const [selectedId, setSelectedId] = useState<number>(moderationQueue[0]?.id ?? 0);

  const pendingCount = items.filter((i) => i.localStatus === 'PENDING').length;
  const selected = items.find((i) => i.id === selectedId) ?? items[0];

  const setStatus = (id: number, status: PostStatus) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, localStatus: status } : i)));
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[26px] font-extrabold tracking-tight text-ink">Kiểm duyệt bài đăng</h1>
        <p className="mt-1 text-sm text-muted">{pendingCount} bài đang chờ</p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_400px]">
        {/* LEFT — Queue list, one card with divider rows */}
        <Card className="overflow-hidden">
          {items.map((post, idx) => {
            const active = selected?.id === post.id;
            return (
              <button
                key={post.id}
                type="button"
                onClick={() => setSelectedId(post.id)}
                className={cn(
                  'flex w-full items-center gap-4 px-5 py-4 text-left transition',
                  idx > 0 && 'border-t border-line',
                  active ? 'bg-primary-soft/50' : 'hover:bg-page/70',
                )}
              >
                <span className="relative h-[84px] w-[120px] shrink-0 overflow-hidden rounded-lg">
                  <Image src={post.image} alt={post.title} fill className="object-cover" sizes="120px" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-bold text-ink">{post.title}</span>
                  <span className="mt-1 block text-sm text-muted">
                    {landlordFor(post)} · Phòng {post.roomCode}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-muted">Đăng {post.createdAt}</span>
                </span>
                <span className="shrink-0 self-start">
                  <StatusBadge status={post.localStatus} />
                </span>
              </button>
            );
          })}

          {items.length === 0 && (
            <div className="p-10 text-center">
              <p className="font-semibold text-ink">Không còn bài chờ duyệt</p>
              <p className="mt-1 text-sm text-muted">Hàng chờ kiểm duyệt đã trống.</p>
            </div>
          )}
        </Card>

        {/* RIGHT — Preview + quick check + actions */}
        {selected && (
          <Card className="overflow-hidden">
            <div className="p-5 pb-0">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl">
                <Image src={selected.image} alt={selected.title} fill className="object-cover" sizes="400px" />
              </div>
              <h2 className="mt-4 text-[17px] font-bold leading-snug text-ink">{selected.title}</h2>
              <p className="mt-1 text-sm text-muted">
                Phòng {selected.roomCode} · {formatVND(selected.price)} / tháng · {selected.area}
              </p>
              <Link
                href={`/admin/kiem-duyet/${selected.id}`}
                className="mt-2 inline-block text-[13px] font-semibold text-primary hover:text-primary-dark"
              >
                Xem chi tiết kiểm duyệt
              </Link>
            </div>

            <div className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Kiểm tra nhanh</p>
              <ul className="mt-3 space-y-2.5">
                {QUICK_CHECKS.map((c) => (
                  <li key={c} className="flex items-center gap-2.5 text-sm text-ink">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-green-600" />
                    {c}
                  </li>
                ))}
              </ul>

              {selected.localStatus === 'PENDING' ? (
                <div className="mt-5 space-y-2.5">
                  <Button className="w-full" size="lg" onClick={() => setStatus(selected.id, 'APPROVED')}>
                    Duyệt bài
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                    onClick={() => setStatus(selected.id, 'REJECTED')}
                  >
                    Từ chối · Kèm lý do
                  </Button>
                </div>
              ) : (
                <div className="mt-5">
                  <StatusBadge status={selected.localStatus} />
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
