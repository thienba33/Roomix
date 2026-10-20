'use client';
import { useState } from 'react';
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
  return (
    <Modal open={open} onClose={onClose} title="Từ chối yêu cầu">
      {(tenantName || roomLabel) && (
        <p className="-mt-2 mb-5 text-sm text-muted">
          {[tenantName, roomLabel].filter(Boolean).join(' · ')}
        </p>
      )}
      <div className="space-y-1">
        {REASONS.map((r) => (
          <label key={r} className="flex cursor-pointer items-center gap-3 py-2 text-sm text-ink">
            <input type="radio" name="reject-reason" checked={reason === r} onChange={() => setReason(r)} className="h-[18px] w-[18px] accent-[#4F46E5]" />
            {r}
          </label>
        ))}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder="Nhập lý do chi tiết (không bắt buộc)"
        className="mt-4 w-full rounded-xl border border-line px-4 py-3 text-sm outline-none placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Hủy</Button>
        <Button variant="danger" onClick={() => { onConfirm?.(reason, note); onClose(); }}>Xác nhận từ chối</Button>
      </div>
    </Modal>
  );
}
