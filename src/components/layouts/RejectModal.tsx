'use client';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

const REASONS = ['Phòng đã có người thuê', 'Chưa phù hợp', 'Lý do khác'];

export default function RejectModal({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm?: (reason: string, note: string) => void }) {
  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState('');
  return (
    <Modal open={open} onClose={onClose} title="Từ chối yêu cầu">
      <div className="space-y-2">
        {REASONS.map((r) => (
          <label key={r} className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-4 py-3 text-sm text-ink has-[:checked]:border-red-300 has-[:checked]:bg-red-50">
            <input type="radio" name="reject-reason" checked={reason === r} onChange={() => setReason(r)} className="h-4 w-4 accent-red-600" />
            {r}
          </label>
        ))}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder="Ghi chú thêm (tuỳ chọn)"
        className="mt-4 w-full rounded-xl border border-line px-4 py-3 text-sm outline-none placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Hủy</Button>
        <Button variant="danger" onClick={() => { onConfirm?.(reason, note); onClose(); }}>Xác nhận từ chối</Button>
      </div>
    </Modal>
  );
}
