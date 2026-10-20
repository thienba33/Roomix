'use client';

import { useState } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { moderationQueue, posts, rooms } from '@/lib/data';
import { appendAudit, landlordFor, useAuditExtra, useModerationDecisions } from '@/lib/admin-store';
import { cn, formatVND } from '@/lib/utils';

const CHECKLIST = ['Ảnh hợp lệ', 'Giá khớp khu vực', 'Không chứa thông tin cấm'];

const DESCRIPTION_SAMPLE =
  'Phòng khép kín, đầy đủ nội thất cơ bản: giường, tủ, bàn học, điều hòa, nóng lạnh. Khu vực an ninh, giờ giấc tự do, có chỗ để xe rộng rãi. Gần trường đại học và các tuyến xe buýt chính.';

// C7 · UC04.7 / UC04.8 — shares the SAME store as the queue (C3): a decision
// here removes the post from the queue, updates dashboard/topbar counts, and
// a rejection REQUIRES a reason (backend PostRejectionRequest) that is stored
// and shown. Both actions sit behind ConfirmDialog with an undo toast.
export default function ModerationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { push } = useToast();
  const [decisions, setDecisions] = useModerationDecisions();
  const [, setAuditExtra] = useAuditExtra();
  const [checked, setChecked] = useState<string[]>(CHECKLIST);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [confirm, setConfirm] = useState<'APPROVE' | 'REJECT' | null>(null);

  const all = [...moderationQueue, ...posts];
  const post = all.find((p) => String(p.id) === String(params.id));
  if (!post) notFound();

  const decision = decisions[post.id];
  const room = rooms.find((r) => r.id === post.roomId);
  const gallery = room?.gallery && room.gallery.length > 0 ? room.gallery : [post.image];
  const mainImage = gallery[0] ?? post.image;
  const thumbs = gallery.slice(1, 4);
  const amenities = room?.amenities ?? ['Điều hòa', 'Wifi', 'WC riêng', 'Nóng lạnh'];
  const size = room?.size;
  const floor = room?.floor;

  const decide = (status: 'APPROVED' | 'REJECTED') => {
    const trimmed = reason.trim();
    setDecisions((prev) => ({
      ...prev,
      [post.id]: { postId: post.id, status, reason: status === 'REJECTED' ? trimmed : undefined, decidedAt: new Date().toISOString() },
    }));
    appendAudit(setAuditExtra, status === 'APPROVED' ? 'Duyệt bài đăng' : 'Từ chối bài đăng', post.title);
    push(
      status === 'APPROVED' ? 'Đã duyệt bài đăng' : 'Đã từ chối bài đăng',
      status === 'REJECTED' ? `${post.title} · Lý do: ${trimmed}` : post.title,
      {
        label: 'Hoàn tác',
        onClick: () => {
          setDecisions((prev) => {
            const next = { ...prev };
            delete next[post.id];
            return next;
          });
        },
      },
    );
    router.push('/admin/moderation');
  };

  const undo = () => {
    setDecisions((prev) => {
      const next = { ...prev };
      delete next[post.id];
      return next;
    });
    push('Đã hoàn tác quyết định', 'Bài đăng đã trở lại hàng chờ kiểm duyệt.');
  };

  const requestReject = () => {
    if (!reason.trim()) {
      setReasonError('Lý do từ chối là bắt buộc — chủ trọ sẽ nhận được lý do này (UC04.8).');
      return;
    }
    setConfirm('REJECT');
  };

  const toggleCheck = (item: string) =>
    setChecked((prev) => (prev.includes(item) ? prev.filter((c) => c !== item) : [...prev, item]));

  return (
    <div>
      <Link href="/admin/moderation" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
        Quay lại
      </Link>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_380px] lg:gap-10">
        <div className="min-w-0">
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-line bg-page">
            <Image src={mainImage} alt={post.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 700px" priority />
          </div>

          {thumbs.length > 0 && (
            <div className="mt-3 flex gap-3">
              {thumbs.map((src) => (
                <div key={src} className="relative h-24 w-36 overflow-hidden rounded-xl border border-line bg-page">
                  <Image src={src} alt={post.title} fill className="object-cover" sizes="144px" />
                </div>
              ))}
            </div>
          )}

          <div className="mt-6">
            <h1 className="text-[24px] font-extrabold tracking-tight text-ink">{post.title}</h1>
            <p className="mt-2 text-[15px] text-secondary">
              {formatVND(post.price)}/tháng
              {size ? ` · ${size}m²` : ''}
              {floor ? ` · Tầng ${floor}` : ''}
              {` · ${post.area}`}
            </p>
            <p className="mt-1.5 text-sm text-muted">
              Chủ trọ: {landlordFor(post)} · Đăng {post.createdAt}
            </p>

            <p className="mt-4 max-w-[560px] text-sm leading-relaxed text-ink/80">{DESCRIPTION_SAMPLE}</p>

            <div className="mt-5">
              <p className="mb-2 text-sm font-bold text-ink">Tiện ích</p>
              <div className="flex flex-wrap gap-2">
                {amenities.map((a) => (
                  <span key={a} className="rounded-full bg-page px-3 py-1.5 text-[13px] font-medium text-ink">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <Card className="sticky top-24 p-6">
            <h2 className="text-[17px] font-bold text-ink">Kiểm duyệt</h2>

            {decision ? (
              <div className="mt-4">
                <Badge tone={decision.status === 'APPROVED' ? 'green' : 'red'} dot>
                  {decision.status === 'APPROVED' ? 'Đã duyệt' : 'Đã từ chối'}
                </Badge>
                {decision.status === 'REJECTED' && decision.reason && (
                  <p className="mt-3 text-sm leading-relaxed text-red-700">Lý do từ chối: {decision.reason}</p>
                )}
                <p className="mt-2 text-[13px] text-muted">Quyết định đã được ghi nhận — bài không còn trong hàng chờ.</p>
                <Button variant="outline" className="mt-4 w-full" onClick={undo}>
                  Hoàn tác quyết định
                </Button>
              </div>
            ) : (
              <>
                <ul className="mt-4 space-y-3">
                  {CHECKLIST.map((item) => {
                    const on = checked.includes(item);
                    return (
                      <li key={item}>
                        <button type="button" onClick={() => toggleCheck(item)} aria-pressed={on} className="flex items-center gap-2.5 text-sm text-ink">
                          <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white', on ? 'bg-green-600' : 'bg-gray-300')}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                          </span>
                          {item}
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-5">
                  <Badge tone="green" className="px-4 py-1.5">Rủi ro thấp</Badge>
                </div>

                <div className="mt-5">
                  <Input
                    name="rejectReason"
                    placeholder="Lý do từ chối (bắt buộc khi từ chối)"
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      if (reasonError) setReasonError('');
                    }}
                    aria-invalid={!!reasonError}
                  />
                  {reasonError && <p role="alert" className="mt-1.5 text-[13px] font-medium text-red-600">{reasonError}</p>}
                </div>

                <div className="mt-5 flex gap-3">
                  <Button className="flex-1" onClick={() => setConfirm('APPROVE')}>Duyệt bài</Button>
                  <Button variant="outline" className="flex-1 border-red-300 text-red-600 hover:border-red-500 hover:text-red-700" onClick={requestReject}>
                    Từ chối
                  </Button>
                </div>

                <p className="mt-4 text-center text-xs leading-relaxed text-muted">
                  Hành động kiểm duyệt sẽ được ghi vào nhật ký hoạt động.
                </p>
              </>
            )}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirm === 'APPROVE'}
        title="Duyệt bài đăng?"
        description={`Bài “${post.title}” sẽ được hiển thị công khai cho khách thuê. Quyết định được ghi vào nhật ký và có thể hoàn tác.`}
        confirmLabel="Duyệt bài"
        onConfirm={() => decide('APPROVED')}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'REJECT'}
        title="Từ chối bài đăng?"
        description={`Bài “${post.title}” sẽ bị từ chối với lý do: “${reason.trim()}”. Chủ trọ sẽ nhận được lý do này để sửa bài. Quyết định có thể hoàn tác.`}
        confirmLabel="Từ chối bài"
        danger
        onConfirm={() => decide('REJECTED')}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
