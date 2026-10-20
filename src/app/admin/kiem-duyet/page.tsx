'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { moderationQueue } from '@/lib/data';
import { formatVND, postStatusLabel } from '@/lib/utils';
import type { Post, PostStatus } from '@/types';

type QueueItem = Post & { localStatus: PostStatus };

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

export default function ModerationPage() {
  const [items, setItems] = useState<QueueItem[]>(
    () => moderationQueue.map((p) => ({ ...p, localStatus: p.status })),
  );

  const pendingCount = items.filter((i) => i.localStatus === 'PENDING').length;

  const setStatus = (id: number, status: PostStatus) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, localStatus: status } : i)));
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[26px] font-extrabold tracking-tight text-ink">Kiểm duyệt bài đăng</h1>
        <p className="mt-1 text-sm text-muted">{pendingCount} bài đang chờ</p>
      </div>

      <div className="space-y-3">
        {items.map((post) => {
          const isPending = post.localStatus === 'PENDING';
          return (
            <Link key={post.id} href={`/admin/kiem-duyet/${post.id}`} className="block">
              <Card className="p-4 transition hover:border-primary/40 hover:shadow-md">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl sm:w-40">
                    <Image src={post.image} alt={post.title} fill className="object-cover" sizes="160px" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold text-ink">{post.title}</p>
                    <p className="mt-1 text-sm text-muted">
                      {landlordFor(post)} · Phòng {post.roomCode}
                    </p>
                    <p className="mt-0.5 text-[13px] text-muted">
                      Đăng {post.createdAt} · {formatVND(post.price)}/tháng
                    </p>
                    <div className="mt-2.5">
                      {post.localStatus === 'PENDING' && <Badge tone="amber" dot>Chờ duyệt</Badge>}
                      {post.localStatus === 'APPROVED' && <Badge tone="green" dot>Đã duyệt</Badge>}
                      {post.localStatus === 'REJECTED' && <Badge tone="red" dot>Từ chối</Badge>}
                      {!['PENDING', 'APPROVED', 'REJECTED'].includes(post.localStatus) && (
                        <Badge tone="gray" dot>{postStatusLabel[post.localStatus]}</Badge>
                      )}
                    </div>
                  </div>

                  {isPending && (
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setStatus(post.id, 'APPROVED');
                        }}
                      >
                        Duyệt bài
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setStatus(post.id, 'REJECTED');
                        }}
                        className="border-red-200 text-red-600 hover:border-red-400 hover:text-red-700"
                      >
                        Từ chối
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          );
        })}

        {items.length === 0 && (
          <Card className="p-10 text-center">
            <p className="font-semibold text-ink">Không còn bài chờ duyệt</p>
            <p className="mt-1 text-sm text-muted">Hàng chờ kiểm duyệt đã trống.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
