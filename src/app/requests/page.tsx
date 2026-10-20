'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import TenantShell from '@/components/layouts/TenantShell';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { rooms, landlord } from '@/lib/data';
import { formatPriceShort } from '@/lib/utils';
import {
  cancelRequest,
  getMergedRequests,
  restoreRequest,
  type TenantRequest,
  type TenantRequestStatus,
} from '@/lib/tenant-store';

const STATUS_META: Record<TenantRequestStatus, { label: string; tone: 'amber' | 'green' | 'red' | 'gray' }> = {
  PENDING: { label: 'Đang chờ', tone: 'amber' },
  ACCEPTED: { label: 'Đã chấp nhận', tone: 'green' },
  REJECTED: { label: 'Đã từ chối', tone: 'red' },
  CANCELLED: { label: 'Đã hủy', tone: 'gray' },
};

export default function MyRequestsPage() {
  const toast = useToast();
  const [items, setItems] = useState<TenantRequest[]>([]);
  const [confirming, setConfirming] = useState<TenantRequest | null>(null);

  useEffect(() => {
    setItems(getMergedRequests());
  }, []);

  const doCancel = (req: TenantRequest) => {
    cancelRequest(req);
    setItems(getMergedRequests());
    toast.push('Đã hủy yêu cầu', `${req.room} · Yêu cầu chuyển sang trạng thái Đã hủy.`, {
      label: 'Hoàn tác',
      onClick: () => {
        restoreRequest(req);
        setItems(getMergedRequests());
      },
    });
  };

  return (
    <TenantShell>
      <div className="w-full px-6 py-6 lg:px-12">
        <h1 className="text-2xl font-semibold text-ink">Yêu cầu của tôi</h1>

        {items.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[17px] font-semibold text-ink">Chưa có yêu cầu nào</p>
            <p className="mx-auto mt-2 max-w-[420px] text-sm text-muted">
              Khi bạn gửi yêu cầu quan tâm tới một phòng, yêu cầu sẽ xuất hiện ở đây để theo dõi phản hồi của chủ trọ.
            </p>
            <Link href="/" className="mt-6 inline-block">
              <Button>Tìm phòng ngay</Button>
            </Link>
          </div>
        ) : (
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

                    {req.message && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted">“{req.message}”</p>
                    )}

                    {req.status === 'ACCEPTED' && (
                      <p className="mt-2 text-sm text-ink">
                        SĐT {landlord.phone} · Zalo · {landlord.email}
                      </p>
                    )}
                    {req.status === 'PENDING' && (
                      <>
                        <p className="mt-2 text-sm text-muted">
                          Đã gửi {req.date} · Chủ trọ chưa phản hồi
                        </p>
                        <Button variant="outline" size="sm" className="mt-3" onClick={() => setConfirming(req)}>
                          Hủy yêu cầu
                        </Button>
                      </>
                    )}
                    {req.status === 'REJECTED' && (
                      <p className="mt-2 text-sm text-muted">
                        Chủ trọ đã từ chối yêu cầu này.
                      </p>
                    )}
                    {req.status === 'CANCELLED' && (
                      <p className="mt-2 text-sm text-muted">
                        Bạn đã hủy yêu cầu này · Gửi {req.date}
                      </p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <ConfirmDialog
          open={confirming !== null}
          title="Hủy yêu cầu quan tâm?"
          description={
            confirming
              ? `Yêu cầu tới ${confirming.room} sẽ chuyển sang trạng thái Đã hủy và chủ trọ không xử lý nữa. Bạn vẫn có thể hoàn tác ngay sau khi hủy.`
              : ''
          }
          confirmLabel="Hủy yêu cầu"
          cancelLabel="Giữ lại"
          danger
          onConfirm={() => {
            if (confirming) doCancel(confirming);
          }}
          onCancel={() => setConfirming(null)}
        />
      </div>
    </TenantShell>
  );
}
