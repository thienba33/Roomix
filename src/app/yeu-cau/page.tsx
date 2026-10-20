'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import TenantShell from '@/components/layouts/TenantShell';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { requests as seedRequests, rooms, landlord } from '@/lib/data';
import type { RentalRequestItem, RequestStatus } from '@/types';

const STATUS_META: Record<RequestStatus, { label: string; tone: 'amber' | 'green' | 'red' }> = {
  PENDING: { label: 'Đang chờ', tone: 'amber' },
  ACCEPTED: { label: 'Đã chấp nhận', tone: 'green' },
  REJECTED: { label: 'Đã từ chối', tone: 'red' },
};

function ContactCardPanel() {
  return (
    <div className="mt-4 rounded-2xl bg-primary-soft p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-primary-dark">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 7.5-2" /></svg>
        Contact Card đã mở khóa
      </p>
      <div className="mt-2.5 grid gap-1.5 text-sm text-ink sm:grid-cols-3">
        <p><span className="text-muted">Điện thoại: </span><span className="font-semibold">{landlord.phone}</span></p>
        <p><span className="text-muted">Email: </span><span className="font-semibold">{landlord.email}</span></p>
        <p><span className="text-muted">Zalo: </span><span className="font-semibold">{landlord.phone}</span></p>
      </div>
    </div>
  );
}

export default function MyRequestsPage() {
  const [items, setItems] = useState<RentalRequestItem[]>(seedRequests);

  const accept = (id: number) =>
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'ACCEPTED' as RequestStatus } : r)));

  return (
    <TenantShell>
      <div className="w-full px-6 py-6 lg:px-12">
        <h1 className="text-[28px] font-extrabold text-ink">Yêu cầu của tôi</h1>
        <p className="mt-1 text-sm text-muted">{items.length} yêu cầu quan tâm đã gửi cho chủ trọ</p>

        <div className="mt-7 space-y-4">
          {items.map((req) => {
            const room = rooms.find((r) => r.id === req.roomId);
            const meta = STATUS_META[req.status];
            return (
              <Card key={req.id} className="overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  {room && (
                    <Link href={`/phong/${room.id}`} className="relative block h-44 shrink-0 sm:h-auto sm:w-[200px]">
                      <Image src={room.image} alt={room.name} fill sizes="200px" className="object-cover" />
                    </Link>
                  )}
                  <div className="min-w-0 flex-1 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-ink">{room ? room.name : req.room}</h3>
                        <p className="mt-0.5 text-sm text-muted">{room ? room.house : landlord.house} · Gửi ngày {req.date}</p>
                      </div>
                      <Badge tone={meta.tone} dot>{meta.label}</Badge>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink">“{req.message}”</p>

                    {req.status === 'ACCEPTED' && <ContactCardPanel />}

                    {req.status === 'PENDING' && (
                      <div className="mt-4">
                        <Button variant="outline" size="sm" onClick={() => accept(req.id)}>
                          Mô phỏng: chủ trọ chấp nhận
                        </Button>
                      </div>
                    )}

                    {req.status === 'REJECTED' && (
                      <p className="mt-3 text-sm text-muted">Chủ trọ chưa thể tiếp nhận yêu cầu này. Hãy thử phòng khác nhé.</p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </TenantShell>
  );
}
