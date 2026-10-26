'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { useCatalog } from '@/hooks/useCatalog';
import { useRental } from '@/hooks/useRental';
import { formatVND } from '@/lib/utils';
import { findMockUserById } from '@/services/mock/auth';
import type { Tenancy } from '@/services/mock/rental';

const TENANCY_LABELS: Record<Tenancy['status'], string> = {
  PENDING: 'Chờ xác nhận cọc',
  ACTIVE: 'Đang thuê',
  CANCELLED: 'Đã hủy',
  ENDED: 'Đã kết thúc',
};

// UC05.1 (mock): landlord's tenant directory, derived from real tenancies
// (the backend has no separate tenant entity — tenants are users linked by
// tenancy, and assignment only happens via an accepted request, UC02.7).
// Search by tenant name/phone/room; detail shows that tenant's tenancies.
export default function TenantDirectory() {
  const { user, ready: authReady } = useAuth();
  const rental = useRental();
  const catalog = useCatalog();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const tenants = useMemo(() => {
    const byTenant = new Map<string, Tenancy[]>();
    for (const tenancy of rental.tenancies) {
      const list = byTenant.get(tenancy.tenantId) ?? [];
      list.push(tenancy);
      byTenant.set(tenancy.tenantId, list);
    }
    return [...byTenant.entries()].map(([tenantId, tenancies]) => {
      const info = findMockUserById(tenantId);
      const rooms = tenancies.map((t) => catalog.items.find((r) => r.detail.roomId === t.roomId)?.detail);
      return { tenantId, info, tenancies: tenancies.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)), rooms };
    });
  }, [rental.tenancies, catalog.items]);

  if (!authReady || !rental.ready) return null;
  if (user?.role !== 'LANDLORD') return null;

  const q = query.trim().toLowerCase();
  const visible = tenants.filter(({ info, rooms }) => {
    if (!q) return true;
    const haystack = `${info?.fullName ?? ''} ${info?.phoneNumber ?? ''} ${rooms.map((r) => r?.roomNumber ?? '').join(' ')} ${rooms.map((r) => r?.title ?? '').join(' ')}`.toLowerCase();
    return haystack.includes(q);
  });
  const selected = tenants.find((t) => t.tenantId === selectedId) ?? null;

  return <section aria-label="Danh sách khách thuê" className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h2 className="text-xl font-bold text-ink">Khách thuê của tôi</h2><p className="mt-1 text-sm text-muted">{tenants.length} khách thuê · từ các hợp đồng đã tạo qua yêu cầu được chấp nhận.</p></div>
    </div>
    <Input id="tenant-search" type="search" label="Tìm khách thuê" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nhập tên, số điện thoại hoặc số phòng…" />
    {visible.length ? <div className="overflow-hidden rounded-2xl border border-line bg-white">
      {visible.map(({ tenantId, info, tenancies, rooms }) => (
        <button key={tenantId} type="button" onClick={() => setSelectedId(tenantId)} className="flex w-full flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 text-left last:border-b-0 hover:bg-page/50">
          <span className="min-w-0">
            <span className="block truncate font-semibold text-ink">{info?.fullName ?? 'Khách thuê'}</span>
            <span className="mt-0.5 block truncate text-sm text-muted">{rooms.filter(Boolean).map((r) => `Phòng ${r!.roomNumber}`).join(', ') || 'Chưa có phòng'} · {tenancies.length} hợp đồng</span>
          </span>
          <span className="text-sm font-semibold text-primary">Xem chi tiết →</span>
        </button>
      ))}
    </div> : <p className="rounded-2xl border border-dashed border-line bg-page px-6 py-10 text-center text-sm text-muted">{tenants.length ? 'Không có khách thuê nào khớp tìm kiếm.' : 'Chưa có khách thuê. Khi bạn chấp nhận một yêu cầu quan tâm, khách thuê sẽ xuất hiện tại đây.'}</p>}
    <Modal open={!!selected} onClose={() => setSelectedId(null)} title={selected?.info?.fullName ?? 'Chi tiết khách thuê'}>
      {selected && <div className="space-y-4">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-muted">Số điện thoại</dt><dd className="mt-0.5 font-semibold">{selected.info?.phoneNumber || 'Chưa cung cấp'}</dd></div>
          <div><dt className="text-muted">Email</dt><dd className="mt-0.5 break-words font-semibold">{selected.info?.email || 'Chưa cung cấp'}</dd></div>
        </dl>
        <div>
          <h3 className="text-sm font-bold">Hợp đồng ({selected.tenancies.length})</h3>
          <div className="mt-2 space-y-2">
            {selected.tenancies.map((t) => {
              const room = catalog.items.find((r) => r.detail.roomId === t.roomId)?.detail;
              return <div key={t.id} className="rounded-xl border border-line p-3 text-sm">
                <p className="font-semibold">{room ? `${room.title} · Phòng ${room.roomNumber}` : 'Phòng thuê'} <span className="font-normal text-muted">· {TENANCY_LABELS[t.status]}</span></p>
                <p className="mt-1 text-muted">{formatVND(t.monthlyRent)}/tháng · {t.startDate.split('-').reverse().join('/')} → {t.endDate.split('-').reverse().join('/')} · Mã {t.contractCode}</p>
              </div>;
            })}
          </div>
        </div>
        <div className="flex justify-end"><Button variant="outline" onClick={() => setSelectedId(null)}>Đóng</Button></div>
      </div>}
    </Modal>
  </section>;
}
