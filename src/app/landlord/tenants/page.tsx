'use client';
import { useState } from 'react';
import { rooms, stats, tenancies } from '@/lib/data';
import type { Tenant } from '@/types';
import { cn, formatPriceShort } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const statusText: Record<Tenant['status'], { label: string; className: string }> = {
  ACTIVE: { label: 'Đang thuê', className: 'text-[#15803D]' },
  ENDING: { label: 'Sắp hết hạn', className: 'text-[#B45309]' },
  ENDED: { label: 'Đã kết thúc', className: 'text-[#6A6A6A]' },
};

const contractStatusLabel: Record<Tenant['status'], string> = {
  ACTIVE: 'Đang hiệu lực',
  ENDING: 'Sắp kết thúc',
  ENDED: 'Đã kết thúc',
};

function houseOf(roomLabel: string): string {
  const code = roomLabel.replace('Phòng', '').trim();
  return rooms.find((r) => r.code === code)?.house ?? 'Roomix Lê Văn Lương';
}

export default function KhachThuePage() {
  const [selectedId, setSelectedId] = useState(tenancies[0].id);
  const selected = tenancies.find((t) => t.id === selectedId) ?? tenancies[0];
  const roomCode = selected.room.replace('Phòng', '').trim();
  const rent = rooms.find((r) => r.code === roomCode)?.price ?? selected.deposit;

  const fields = [
    { label: 'GIÁ THUÊ', value: `${formatPriceShort(rent)} / tháng` },
    { label: 'ĐẶT CỌC', value: `${formatPriceShort(selected.deposit)} (1 tháng)` },
    { label: 'ĐIỆN', value: '3.500đ / kWh' },
    { label: 'NƯỚC', value: '100.000đ / người' },
    { label: 'CHU KỲ', value: 'Thanh toán đầu tháng' },
    { label: 'TRẠNG THÁI', value: contractStatusLabel[selected.status] },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Khách thuê & Hợp đồng</h1>
        <p className="mt-1 text-sm text-muted">{stats.rented} khách đang thuê</p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="px-5 pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">KHÁCH</p>
        </div>
        <div className="mt-2 divide-y divide-line">
          {tenancies.map((t) => {
            const st = statusText[t.status];
            const isSelected = t.id === selected.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedId(t.id)}
                className={cn(
                  'flex w-full items-center gap-3.5 px-5 py-3.5 text-left',
                  isSelected && 'bg-primary-soft/40',
                )}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[13px] font-bold text-primary">
                  {t.initials ?? 'KH'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink">{t.name}</span>
                  <span className="mt-0.5 block text-sm text-muted">{t.room} · {houseOf(t.room)}</span>
                </span>
                <span className={cn('shrink-0 text-[13px] font-semibold', st.className)}>{st.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-[17px] font-semibold text-ink">Hợp đồng #HD-{roomCode} · {selected.name}</h2>
        <div className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((f) => (
            <div key={f.label}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{f.label}</p>
              <p className="mt-1 font-medium text-ink">{f.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-3">
          <Button type="button" variant="outline">Phân phòng</Button>
          <Button type="button" variant="outline">Trả phòng / Tất toán</Button>
        </div>
      </Card>
    </div>
  );
}
