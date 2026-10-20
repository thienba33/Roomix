'use client';
import { useState } from 'react';
import { requests as seed } from '@/lib/data';
import type { RentalRequestItem, RequestStatus } from '@/types';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import RejectModal from '@/components/layouts/RejectModal';
import { useToast } from '@/components/ui/Toast';

const statusLabel: Record<RequestStatus, string> = {
  PENDING: 'Chờ xử lý',
  ACCEPTED: 'Đã chấp nhận',
  REJECTED: 'Đã từ chối',
};
const statusTone: Record<RequestStatus, 'amber' | 'green' | 'red'> = {
  PENDING: 'amber',
  ACCEPTED: 'green',
  REJECTED: 'red',
};

export default function YeuCauPage() {
  const toast = useToast();
  const [items, setItems] = useState<RentalRequestItem[]>(seed);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const pendingCount = items.filter((i) => i.status === 'PENDING').length;

  const accept = (id: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'ACCEPTED' as RequestStatus } : i)));
    toast.push('Đã chấp nhận — Contact Card đã được gửi');
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px] font-extrabold text-ink">Yêu cầu quan tâm</h1>
        <p className="mt-1 text-sm text-muted">{pendingCount} yêu cầu đang chờ xử lý</p>
      </div>

      <div className="space-y-3">
        {items.map((req) => (
          <Card key={req.id} className="flex flex-wrap gap-4 p-4 sm:flex-nowrap">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
              {req.initials ?? 'KH'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">
                {req.tenant}
                <span className="font-normal text-muted"> · {req.room}</span>
              </p>
              <p className="mt-0.5 truncate text-sm text-muted">{req.message}</p>
              <p className="mt-0.5 text-[13px] text-muted">{req.date}</p>
              {req.status === 'ACCEPTED' && (
                <p className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-green-700">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>
                  Đã gửi Contact Card
                </p>
              )}
              {req.status === 'REJECTED' && <p className="mt-2 text-[13px] text-muted">Đã từ chối yêu cầu</p>}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2.5">
              <Badge tone={statusTone[req.status]} dot>{statusLabel[req.status]}</Badge>
              {req.status === 'PENDING' && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => accept(req.id)}>Chấp nhận</Button>
                  <Button size="sm" variant="outline" onClick={() => setRejectId(req.id)}>Từ chối</Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <RejectModal
        open={rejectId !== null}
        onClose={() => setRejectId(null)}
        onConfirm={() => {
          if (rejectId !== null) {
            setItems((prev) => prev.map((i) => (i.id === rejectId ? { ...i, status: 'REJECTED' as RequestStatus } : i)));
            toast.push('Đã từ chối yêu cầu');
          }
        }}
      />
    </div>
  );
}
