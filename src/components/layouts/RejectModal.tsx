'use client';
import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

const REASONS = ['Phòng đã có người thuê', 'Chưa phù hợp', 'Lý do khác'];

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm?: (reason: string, note: string) => void;
  tenantName?: string;
  roomLabel?: string;
}

export default function RejectModal({ open, onClose, onConfirm, tenantName, roomLabel }: Props) {
  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) { setReason(REASONS[0]); setNote(''); setError(''); }
  }, [open ]);

  const handleConfirm = () => {
    // Reason is REQUIRED (UC02.7 / POST /reject ReasonRequest). "Lý do khác" requires detail.
    if (!reason) { setError('Vui lòng chọn lý do từ chối'); return; }
    if (reason === 'Lý do khác' && !note.trim()) { setError('Vui lòng nhập lý do chi tiết khi chọn "Lý do khác"'); return; }
    const full = note.trim() ? `${reason}: ${note.trim()}` : reason;
    onConfirm?.(full, note.trim());
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Từ chối yêu cầu">
      {(tenantName || roomLabel) && (
        <p className="-mt-2 mb-5 text-sm text-muted">
          {[tenantName, roomLabel].filter(Boolean).join(' · ')}
        </p>
      )}
      <p className="mb-2 text-[13px] font-semibold text-ink">Lý do từ chối <span className="text-red-600">*</span></p>
      <div className="space-y-1">
        {REASONS.map((r) => (
          <label key={r} className="flex cursor-pointer items-center gap-3 py-2 text-sm text-ink">
            <input type="radio" name="reject-reason" checked={reason === r} onChange={() => { setReason(r); setError(''); }} className="h-[18px] w-[18px] accent-[#4F46E5]" />
            {r}
          </label>
        ))}
      </div>
      <label className="mt-4 block text-[13px] font-semibold text-ink">
        Chi tiết {reason === 'Lý do khác' ? <span className="text-red-600">*</span> : <span className="font-normal text-muted">(không bắt buộc)</span>}
      </label>
      <textarea
        value={note}
        onChange={(e) => { setNote(e.target.value); if (e.target.value.trim()) setError(''); }}
        rows={3}
        placeholder="Nhập lý do chi tiết — lý do này sẽ hiển thị cho khách thuê"
        className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-sm outline-none placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      {error && <p className="mt-2 text-[13px] font-medium text-red-600" role="alert">{error}</p>}
      <p className="mt-3 text-[13px] text-muted">Lý do sẽ được gửi cho khách thuê (trường rejectReason).</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Hủy</Button>
        <Button variant="danger" onClick={handleConfirm}>Xác nhận từ chối</Button>
      </div>
    </Modal>
  );
}
