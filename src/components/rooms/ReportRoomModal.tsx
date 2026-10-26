'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { submitTenantReport } from '@/lib/admin-store';

const REASONS = ['Thông tin phòng không đúng thực tế', 'Nghi ngờ lừa đảo', 'Giá thuê khác với tin đăng', 'Ảnh phòng không phải ảnh thật', 'Lý do khác'];

// UC07.6 tenant side (mock): a report lands in the admin reports queue.
// The backend has no report module yet, so the report is stored in the
// browser admin store and processed from /admin/reports.
export default function ReportRoomModal({ roomTitle, roomCode }: { roomTitle: string; roomCode: string }) {
  const { user } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [detail, setDetail] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    if (detail.trim().length > 2000) {
      setError('Mô tả tối đa 2000 ký tự.');
      return;
    }
    try {
      submitTenantReport({
        reporter: user?.fullName ?? 'Khách vãng lai',
        target: `${roomTitle} (Phòng ${roomCode})`,
        reason,
        detail: detail.trim() || undefined,
      });
      setOpen(false);
      setDetail('');
      setError('');
      toast.push('Đã gửi báo cáo', 'Quản trị viên sẽ kiểm tra và xử lý báo cáo này.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể gửi báo cáo.');
    }
  };

  return <>
    <button type="button" onClick={() => setOpen(true)} className="text-sm font-semibold text-muted hover:text-red-600">Báo cáo tin đăng này</button>
    <Modal open={open} onClose={() => setOpen(false)} title="Báo cáo tin đăng">
      <p className="text-sm leading-6 text-muted">{roomTitle} · Phòng {roomCode}</p>
      <label htmlFor="report-reason" className="mt-4 block text-sm font-semibold">Lý do báo cáo *</label>
      <select id="report-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-3 text-sm focus:border-primary focus:outline-2 focus:outline-primary/20">
        {REASONS.map((r) => <option key={r}>{r}</option>)}
      </select>
      <label htmlFor="report-detail" className="mt-4 block text-sm font-semibold">Mô tả thêm</label>
      <textarea id="report-detail" value={detail} onChange={(e) => setDetail(e.target.value)} maxLength={2000} rows={4} placeholder="Mô tả dấu hiệu vi phạm bạn thấy…" className="mt-2 w-full rounded-xl border border-line p-3 text-sm focus:border-primary focus:outline-2 focus:outline-primary/20" />
      <p className="mt-1 text-right text-xs text-muted">{detail.length}/2000 ký tự</p>
      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button onClick={submit}>Gửi báo cáo</Button></div>
    </Modal>
  </>;
}
