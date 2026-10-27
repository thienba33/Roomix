'use client';

import type { RentalRequest } from '@/services/backend/rental';
import Badge from '@/components/ui/Badge';

export default function ContactCard({ request }: { request: RentalRequest }) {
  if (request.status !== 'ACCEPTED') return null;

  return (
    <section className="mt-4 rounded-xl border border-green-200 bg-green-50/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-green-900 flex items-center gap-1.5">
          <span>📇</span> Danh thiếp liên hệ chủ trọ (UC02.8)
        </h3>
        <Badge tone="green">Đã cấp quyền liên hệ</Badge>
      </div>
      <p className="mt-2 text-xs text-green-800">
        Yêu cầu thuê đã được chủ trọ phê duyệt. Bạn có thể liên hệ trực tiếp với chủ trọ để trao đổi chi tiết nhận phòng và xem hợp đồng.
      </p>
      <div className="mt-3 grid gap-2 rounded-lg bg-white p-3 border border-green-100 text-sm">
        <div className="flex justify-between items-center text-xs text-muted">
          <span>Mã chủ trọ:</span>
          <span className="font-mono text-ink font-semibold">{request.landlordId.slice(0, 8)}…{request.landlordId.slice(-4)}</span>
        </div>
        <div className="flex justify-between items-center text-xs text-muted">
          <span>Thời điểm phê duyệt:</span>
          <span className="text-ink">{new Date(request.updatedAt).toLocaleString('vi-VN')}</span>
        </div>
        <div className="mt-1 pt-2 border-t border-line/60 flex items-center justify-between">
          <span className="text-xs font-semibold text-secondary">Kênh liên hệ:</span>
          <span className="text-xs font-bold text-primary">Trao đổi qua điện thoại / Zalo hoặc phòng chat trực tuyến</span>
        </div>
      </div>
    </section>
  );
}
