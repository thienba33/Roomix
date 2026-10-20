'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { moderationQueue } from '@/lib/data';
import { appendAudit, landlordFor, useAuditExtra, useModerationDecisions } from '@/lib/admin-store';
import { cn, formatVND, postStatusLabel } from '@/lib/utils';
import type { PostStatus } from '@/types';

const QUICK_CHECKS = [
  'Ảnh thật, rõ nét',
  'Giá khớp mặt bằng khu vực',
  'Địa chỉ hợp lệ',
  'Không dấu hiệu lừa đảo',
];

function StatusBadge({ status }: { status: PostStatus }) {
  if (status === 'PENDING') return <Badge tone="amber" dot>Chờ duyệt</Badge>;
  if (status === 'APPROVED') return <Badge tone="green" dot>Đã duyệt</Badge>;
  if (status === 'REJECTED') return <Badge tone="red" dot>Từ chối</Badge>;
  return <Badge tone="gray" dot>{postStatusLabel[status]}</Badge>;
}

export default function ModerationPage() {
  const { push } = useToast();
  const [decisions, setDecisions] = useModerationDecisions();
  const [, setAuditExtra] = useAuditExtra();
  const [selectedId, setSelectedId] = useState<number>(moderationQueue[0]?.id ?? 0);
  const [quickChecked, setQuickChecked] = useState<string[]>(QUICK_CHECKS);
  const [approveTarget, setApproveTarget] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const pendingItems = useMemo(() => moderationQueue.filter((p) => !decisions[p.id]), [decisions]);
  const decidedItems = useMemo(
    () => moderationQueue.filter((p) => decisions[p.id]).map((p) => ({ post: p, decision: decisions[p.id] })),
    [decisions],
  );
  const pendingCount = pendingItems.length;
  const selected = pendingItems.find((i) => i.id === selectedId) ?? pendingItems[0];

  const decide = (id: number, status: 'APPROVED' | 'REJECTED', reason?: string) => {
    const post = moderationQueue.find((p) => p.id === id);
    setDecisions((prev) => ({
      ...prev,
      [id]: { postId: id, status, reason, decidedAt: new Date().toISOString() },
    }));
    appendAudit(setAuditExtra, status === 'APPROVED' ? 'Duyệt bài đăng' : 'Từ chối bài đăng', post ? post.title : `Bài #${id}`);
    push(
      status === 'APPROVED' ? 'Đã duyệt bài đăng' : 'Đã từ chối bài đăng',
      post ? `${post.title}${reason ? ` · Lý do: ${reason}` : ''}` : undefined,
      {
        label: 'Hoàn tác',
        onClick: () => {
          setDecisions((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        },
      },
    );
  };

  const undoDecision = (id: number) => {
    setDecisions((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    push('Đã hoàn tác quyết định', 'Bài đăng đã trở lại hàng chờ kiểm duyệt.');
  };

  const approvePost = approveTarget != null ? moderationQueue.find((p) => p.id === approveTarget) : undefined;
  const rejectPost = rejectTarget != null ? moderationQueue.find((p) => p.id === rejectTarget) : undefined;

  const confirmReject = () => {
    const reason = rejectReason.trim();
    if (!reason) {
      setRejectError('Lý do từ chối là bắt buộc — chủ trọ sẽ nhận được lý do này (UC04.8).');
      return;
    }
    if (rejectTarget != null) decide(rejectTarget, 'REJECTED', reason);
    setRejectTarget(null);
    setRejectReason('');
    setRejectError('');
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[26px] font-extrabold tracking-tight text-ink">Kiểm duyệt bài đăng</h1>
        <p className="mt-1 text-sm text-muted">{pendingCount} bài đang chờ</p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            {pendingItems.map((post, idx) => {
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
                    <StatusBadge status="PENDING" />
                  </span>
                </button>
              );
            })}

            {pendingItems.length === 0 && (
              <div className="p-10 text-center">
                <p className="font-semibold text-ink">Không còn bài chờ duyệt</p>
                <p className="mt-1 text-sm text-muted">Hàng chờ kiểm duyệt đã trống.</p>
              </div>
            )}
          </Card>

          {decidedItems.length > 0 && (
            <Card className="overflow-hidden">
              <p className="px-5 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted">Đã xử lý trong phiên này</p>
              <div className="divide-y divide-line">
                {decidedItems.map(({ post, decision }) => (
                  <div key={post.id} className="flex items-start gap-3 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{post.title}</p>
                      {decision.status === 'REJECTED' && decision.reason && (
                        <p className="mt-0.5 text-[13px] text-red-700">Lý do từ chối: {decision.reason}</p>
                      )}
                    </div>
                    <StatusBadge status={decision.status} />
                    <button type="button" onClick={() => undoDecision(post.id)} className="shrink-0 text-[13px] font-bold text-primary hover:underline">
                      Hoàn tác
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

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
                href={`/admin/moderation/${selected.id}`}
                className="mt-2 inline-block text-[13px] font-semibold text-primary hover:text-primary-dark"
              >
                Xem chi tiết kiểm duyệt
              </Link>
            </div>

            <div className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Kiểm tra nhanh</p>
              <ul className="mt-3 space-y-2.5">
                {QUICK_CHECKS.map((c) => {
                  const on = quickChecked.includes(c);
                  return (
                    <li key={c}>
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => setQuickChecked((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))}
                        className="flex items-center gap-2.5 text-sm text-ink"
                      >
                        <span className={cn('h-2 w-2 shrink-0 rounded-full', on ? 'bg-green-600' : 'bg-gray-300')} />
                        {c}
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-5 space-y-2.5">
                <Button className="w-full" size="lg" onClick={() => setApproveTarget(selected.id)}>
                  Duyệt bài
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    setRejectReason('');
                    setRejectError('');
                    setRejectTarget(selected.id);
                  }}
                >
                  Từ chối · Kèm lý do
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={approveTarget != null}
        title="Duyệt bài đăng?"
        description={approvePost ? `Bài “${approvePost.title}” sẽ được hiển thị công khai cho khách thuê. Quyết định được ghi vào nhật ký hoạt động và có thể hoàn tác.` : ''}
        confirmLabel="Duyệt bài"
        onConfirm={() => {
          if (approveTarget != null) decide(approveTarget, 'APPROVED');
        }}
        onCancel={() => setApproveTarget(null)}
      />

      <Modal open={rejectTarget != null} onClose={() => setRejectTarget(null)} title="Từ chối bài đăng" widthClass="max-w-md">
        <p className="text-sm leading-relaxed text-muted">
          {rejectPost ? `Bài “${rejectPost.title}” sẽ bị từ chối. ` : ''}Lý do là bắt buộc — backend lưu lý do này (<span className="font-mono text-[13px]">PostRejectionRequest</span>) và chủ trọ sẽ nhìn thấy để sửa bài.
        </p>
        <label htmlFor="moderation-reject-reason" className="mt-4 block text-[13px] font-semibold text-ink">Lý do từ chối *</label>
        <textarea
          id="moderation-reject-reason"
          value={rejectReason}
          onChange={(e) => {
            setRejectReason(e.target.value);
            if (rejectError) setRejectError('');
          }}
          rows={3}
          placeholder="Ví dụ: Ảnh không đúng thực tế, giá chưa khớp mô tả…"
          className="mt-1.5 w-full resize-none rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {rejectError && <p role="alert" className="mt-1.5 text-[13px] font-medium text-red-600">{rejectError}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setRejectTarget(null)}>Hủy</Button>
          <Button type="button" variant="danger" onClick={confirmReject}>Từ chối bài</Button>
        </div>
      </Modal>
    </div>
  );
}
