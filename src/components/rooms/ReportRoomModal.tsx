'use client';
import { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import Button from '@/components/ui/Button';
import { createReport } from '@/services/backend/reports';

const REASONS = ['Thông tin phòng không đúng thực tế', 'Nghi vấn lừa đảo / yêu cầu cọc mập mờ', 'Giá cho thuê sai lệch so với tin đăng', 'Phòng đã cho thuê hoặc bài đăng trùng lặp', 'Vi phạm khác'];
type Props = { roomTitle: string; postId: string; onClose?: () => void };
export default function ReportRoomModal(props: Props) {
  const { user, ready, openAuth } = useAuth();
  if (!ready) return <p role="status" className="py-4 text-sm text-muted">Đang kiểm tra tài khoản…</p>;
  if (!user) return <div className="space-y-3 py-4"><p className="text-sm text-muted">Đăng nhập để gửi báo cáo và theo dõi kết quả xử lý.</p><Button onClick={() => openAuth()}>Đăng nhập</Button></div>;
  return <ReportForm key={`${user.id}:${props.postId}`} {...props} />;
}
function ReportForm({ roomTitle, postId, onClose }: Props) {
  const [reason, setReason] = useState(REASONS[0]);
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await createReport({ targetType: 'POST', targetId: postId, reason, description }); setSubmitted(true); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể gửi báo cáo. Vui lòng thử lại.'); }
    finally { lock.current = false; setBusy(false); }
  };
  if (submitted) return <div className="space-y-3 py-4"><h3 className="font-bold text-ink">Đã gửi báo cáo vi phạm</h3><p role="status" className="text-sm leading-6 text-muted">Báo cáo về bài đăng <strong>{roomTitle}</strong> đã được tiếp nhận.</p><Link href="/reports" className="inline-block text-sm font-semibold text-primary">Xem báo cáo và kết quả xử lý</Link>{onClose && <Button onClick={onClose} variant="outline">Đóng</Button>}</div>;
  return <form onSubmit={submit} aria-busy={busy} className="space-y-4 py-3">
    <p className="text-sm text-muted">Báo cáo bài đăng <strong>{roomTitle}</strong>.</p>
    <label className="block text-sm font-semibold">Lý do<select name="reason" value={reason} onChange={(event) => setReason(event.target.value)} disabled={busy} className="mt-2 w-full rounded-xl border border-line bg-white p-3 text-sm">{REASONS.map((value) => <option key={value}>{value}</option>)}</select></label>
    <label className="block text-sm font-semibold">Chi tiết (không bắt buộc)<textarea name="description" rows={4} maxLength={3000} value={description} onChange={(event) => setDescription(event.target.value)} disabled={busy} placeholder="Mô tả thông tin cần kiểm tra…" className="mt-2 w-full rounded-xl border border-line p-3 text-sm" /></label>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <div className="flex justify-end gap-2">{onClose && <Button type="button" variant="outline" disabled={busy} onClick={onClose}>Hủy</Button>}<Button type="submit" variant="danger" disabled={busy}>{busy ? 'Đang gửi…' : 'Gửi báo cáo vi phạm'}</Button></div>
  </form>;
}
