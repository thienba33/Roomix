'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import TenantShell from '@/components/layouts/TenantShell';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { requests as seedRequests, rooms, landlord } from '@/lib/data';
import { formatPriceShort } from '@/lib/utils';
import type { RentalRequestItem, RequestStatus } from '@/types';

const STATUS_META: Record<RequestStatus, { label: string; tone: 'amber' | 'green' | 'red' }> = {
  PENDING: { label: 'Đang chờ', tone: 'amber' },
  ACCEPTED: { label: 'Đã chấp nhận', tone: 'green' },
  REJECTED: { label: 'Đã từ chối', tone: 'red' },
};

export default function MyRequestsPage() {
  const [items, setItems] = useState<RentalRequestItem[]>(seedRequests);

  const accept = (id: number) =>
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'ACCEPTED' as RequestStatus } : r)));

  return (
    <TenantShell>
      <div className="w-full px-6 py-6 lg:px-12">
        <h1 className="text-2xl font-semibold text-ink">Yêu cầu của tôi</h1>

        <div className="mt-6 space-y-4">
          {items.map((req) => {
            const room = rooms.find((r) => r.id === req.roomId);
            const meta = STATUS_META[req.status];
            return (
              <Card key={req.id} className="flex gap-5 p-4">
                {room ? (
                  <Link
                    href={`/rooms/${room.id}`}
                    className="relative h-[150px] w-[200px] shrink-0 overflow-hidden rounded-xl"
                  >
                    <Image src={room.image} alt={room.name} fill sizes="200px" className="object-cover" />
                  </Link>
                ) : (
                  <div className="h-[150px] w-[200px] shrink-0 rounded-xl bg-[#F7F7F7]" />
                )}
                <div className="min-w-0 flex-1 py-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[17px] font-semibold text-ink">{room ? room.name : req.room}</h3>
                    <Badge tone={meta.tone} dot>{meta.label}</Badge>
                  </div>

                  <p className="mt-1 text-sm text-muted">
                    {room ? `${formatPriceShort(room.price)} / tháng · ${room.area}` : `${req.room} · ${landlord.house}`}
                  </p>

                  {req.status === 'ACCEPTED' && (
                    <p className="mt-2 text-sm text-ink">
                      SĐT {landlord.phone} · Zalo · {landlord.email}
                    </p>
                  )}
                  {req.status === 'PENDING' && (
                    <p className="mt-2 text-sm text-muted">
                      Đã gửi {req.date} · Chủ trọ chưa phản hồi
                    </p>
                  )}
                  {req.status === 'REJECTED' && (
                    <p className="mt-2 text-sm text-muted">
                      Lý do: phòng đã có người đặt trước
                    </p>
                  )}

                  {req.status === 'PENDING' && (
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => accept(req.id)}>
                      Mô phỏng: chủ trọ chấp nhận
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </TenantShell>
  );
}
