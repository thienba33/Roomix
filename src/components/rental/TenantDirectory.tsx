'use client';
import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRental } from '@/hooks/useRental';
import { useRoomDetails } from '@/hooks/useRoomDetails';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { formatVND } from '@/lib/utils';
import type { Tenancy } from '@/services/backend/rental';

const labels = { PENDING: 'Chờ xác nhận cọc', ACTIVE: 'Đang thuê', CANCELLED: 'Đã hủy', ENDED: 'Đã kết thúc' };
export default function TenantDirectory() {
  const { user, ready: authReady } = useAuth();
  const rental = useRental();
  const rooms = useRoomDetails(rental.tenancies.map((item) => item.roomId));
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  if (!authReady || !rental.ready || !rooms.ready) return <p role="status">Đang tải khách thuê…</p>;
  if (user?.role !== 'LANDLORD') return null;
  if (rental.error || rooms.error) return <p role="alert">{rental.error || rooms.error}</p>;

  const byTenant = new Map<string, Tenancy[]>();
  for (const tenancy of rental.tenancies) {
    const records = byTenant.get(tenancy.tenantId) ?? [];
    records.push(tenancy); byTenant.set(tenancy.tenantId, records);
  }
  const title = (id: string) => rooms.items.find((item) => item.roomId === id)?.title ?? `Phòng ${id}`;
  const visible = [...byTenant].filter(([id, records]) => `${id} ${records.map((record) => `${record.roomId} ${record.contractCode} ${title(record.roomId)}`).join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  const selected = selectedId ? byTenant.get(selectedId) ?? [] : [];
  return <section className="space-y-4">
    <div><h2 className="text-xl font-bold">Khách thuê của tôi</h2><p className="mt-1 text-sm text-muted">{byTenant.size} khách thuê từ các hợp đồng của bạn. Thông tin tên và liên hệ hiện chưa được cung cấp.</p></div>
    <Input label="Tìm khách thuê" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Mã khách, mã hợp đồng hoặc phòng…" />
    <div className="divide-y divide-line rounded-2xl border border-line">{visible.length ? visible.map(([id, records]) => <button key={id} onClick={() => setSelectedId(id)} className="block w-full p-5 text-left hover:bg-page focus-visible:outline-2 focus-visible:outline-primary"><span className="block break-all text-sm font-semibold">Khách thuê {id}</span><span className="mt-2 block break-words text-sm text-muted">{records.map((record) => title(record.roomId)).join(', ')} · {records.length} hợp đồng</span></button>) : <p className="p-6 text-sm text-muted">Chưa có khách thuê phù hợp.</p>}</div>
    <Modal open={!!selectedId} onClose={() => setSelectedId(null)} title="Hợp đồng của khách thuê"><p className="mb-4 break-all text-xs text-muted">Mã khách thuê: {selectedId}</p><div className="space-y-4">{selected.map((record) => <article key={record.id} className="space-y-2 rounded-xl border border-line p-4"><h3 className="break-words font-semibold">{title(record.roomId)}</h3><p className="break-all text-xs text-muted">{record.contractCode} · {labels[record.status]}</p><dl className="space-y-2 text-sm"><div><dt className="text-muted">Thời hạn</dt><dd>{record.startDate} – {record.endDate}</dd></div><div><dt className="text-muted">Tiền thuê / tháng</dt><dd>{formatVND(record.monthlyRent)}</dd></div><div><dt className="text-muted">Tiền cọc</dt><dd>{formatVND(record.depositAmount)}</dd></div></dl></article>)}</div></Modal>
  </section>;
}
