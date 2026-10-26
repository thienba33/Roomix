'use client';
import type { RentalRequest } from '@/services/backend/rental';
export default function ContactCard({ request }: { request: RentalRequest }) {
  if (request.status !== 'ACCEPTED') return null;
  return <section className="mt-4 rounded-xl border border-line p-4"><h3 className="text-sm font-bold">Liên hệ chủ trọ</h3><p className="mt-2 text-sm text-muted">Yêu cầu đã được chấp nhận. Danh thiếp liên hệ hiện chưa được hệ thống hỗ trợ.</p></section>;
}
