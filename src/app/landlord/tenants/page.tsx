import { rooms, tenancies } from '@/lib/data';
import type { Tenant } from '@/types';
import { formatVND } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

const statusMap: Record<Tenant['status'], { label: string; tone: 'green' | 'amber' | 'gray' }> = {
  ACTIVE: { label: 'Đang thuê', tone: 'green' },
  ENDING: { label: 'Sắp kết thúc', tone: 'amber' },
  ENDED: { label: 'Đã kết thúc', tone: 'gray' },
};

function houseOf(roomLabel: string): string {
  const code = roomLabel.replace('Phòng', '').trim();
  return rooms.find((r) => r.code === code)?.house ?? 'Roomix Lê Văn Lương';
}

export default function KhachThuePage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px] font-extrabold text-ink">Khách thuê &amp; Hợp đồng</h1>
        <p className="mt-1 text-sm text-muted">{tenancies.length} khách thuê · hợp đồng đang quản lý</p>
      </div>

      <Card className="divide-y divide-line/70 overflow-hidden p-0">
        {tenancies.map((t) => {
          const st = statusMap[t.status];
          return (
            <div key={t.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                {t.initials ?? 'KH'}
              </span>
              <div className="min-w-52 flex-1">
                <p className="font-bold text-ink">{t.name}</p>
                <p className="mt-0.5 text-sm text-muted">{t.room} · {houseOf(t.room)}</p>
                <p className="mt-0.5 text-[13px] text-muted">{t.phone} · {t.email}</p>
              </div>
              <div className="shrink-0">
                <p className="text-[13px] text-muted">Thời hạn hợp đồng</p>
                <p className="mt-0.5 text-sm font-semibold text-ink">{t.startDate} → {t.endDate ?? '—'}</p>
              </div>
              <div className="shrink-0">
                <p className="text-[13px] text-muted">Tiền cọc</p>
                <p className="mt-0.5 text-sm font-semibold text-ink">Cọc {formatVND(t.deposit)}</p>
              </div>
              <Badge tone={st.tone} dot>{st.label}</Badge>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
