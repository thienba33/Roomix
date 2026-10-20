'use client';
import { useState } from 'react';
import Image from 'next/image';
import { requests as seed, rooms } from '@/lib/data';
import type { RentalRequestItem, RequestStatus } from '@/types';
import { cn, formatPriceShort } from '@/lib/utils';
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

function roomOf(req: RentalRequestItem) {
  return rooms.find((r) => r.id === req.roomId);
}

export default function YeuCauPage() {
  const toast = useToast();
  const [items, setItems] = useState<RentalRequestItem[]>(seed);
  const [selectedId, setSelectedId] = useState<number>(seed[0]?.id ?? 0);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const pendingCount = items.filter((i) => i.status === 'PENDING').length;
  const selected = items.find((i) => i.id === selectedId) ?? items[0];
  const rejectTarget = items.find((i) => i.id === rejectId);

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

      <div className="grid items-start gap-5 lg:grid-cols-[1.8fr_1fr]">
        <Card className="overflow-hidden p-0">
          <div className="divide-y divide-line/70">
            {items.map((req) => {
              const room = roomOf(req);
              return (
                <button
                  key={req.id}
                  onClick={() => setSelectedId(req.id)}
                  className={cn(
                    'flex w-full items-center gap-3.5 px-5 py-4 text-left transition hover:bg-page/60',
                    selected?.id === req.id && 'bg-primary-soft/40',
                  )}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                    {req.initials ?? 'KH'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-ink">{req.tenant}</span>
                    <span className="mt-0.5 block truncate text-sm text-muted">
                      {req.room}{room ? ` · ${room.area}` : ''}
                    </span>
                    <span className="mt-0.5 block text-[13px] text-muted">{req.date}</span>
                  </span>
                  <Badge tone={statusTone[req.status]} dot className="hidden shrink-0 sm:inline-flex">{statusLabel[req.status]}</Badge>
                  {room && (
                    <Image src={room.image} alt={req.room} width={112} height={112} className="hidden h-14 w-14 shrink-0 rounded-lg object-cover md:block" />
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {selected && (
          <Card className="p-5">
            <h2 className="text-[17px] font-bold text-ink">Chi tiết yêu cầu</h2>

            <p className="mt-5 text-[13px] text-muted">Khách thuê</p>
            <p className="mt-1 font-bold text-ink">{selected.tenant}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">
              SĐT và Zalo sẽ gửi kèm Contact Card sau khi bạn chấp nhận.
            </p>

            <p className="mt-5 text-[13px] text-muted">Phòng quan tâm</p>
            <p className="mt-1 font-semibold text-ink">
              {selected.room}
              {roomOf(selected) ? ` — ${formatPriceShort(roomOf(selected)!.price)} / tháng` : ''}
            </p>

            <div className="mt-5 rounded-xl bg-page px-4 py-3">
              <p className="text-sm leading-relaxed text-ink">&ldquo;{selected.message}&rdquo;</p>
            </div>

            {selected.status === 'PENDING' && (
              <div className="mt-6 space-y-2.5">
                <Button size="lg" className="w-full" onClick={() => accept(selected.id)}>
                  Chấp nhận &amp; gửi Contact Card
                </Button>
                <Button size="lg" variant="outline" className="w-full" onClick={() => setRejectId(selected.id)}>
                  Từ chối
                </Button>
              </div>
            )}
            {selected.status === 'ACCEPTED' && (
              <p className="mt-6 flex items-center gap-1.5 text-sm font-medium text-green-700">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>
                Đã gửi Contact Card
              </p>
            )}
            {selected.status === 'REJECTED' && (
              <p className="mt-6 text-sm text-muted">Đã từ chối yêu cầu này</p>
            )}
          </Card>
        )}
      </div>

      <RejectModal
        open={rejectId !== null}
        onClose={() => setRejectId(null)}
        tenantName={rejectTarget?.tenant}
        roomLabel={rejectTarget?.room}
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
