'use client';
import Link from 'next/link';
import { useRental } from '@/hooks/useRental';
import { useAuth } from '@/components/auth/AuthProvider';
export default function LandlordPage() {
  const { user } = useAuth();
  const { requests, tenancies, ready, error } = useRental();
  if (!ready) return <p role="status">Đang tải tổng quan…</p>;
  if (error) return <p role="alert">{error}</p>;
  return <section className="host-overview space-y-6"><h1 className="text-2xl font-bold">Xin chào, {user?.fullName}</h1><div className="host-metrics grid gap-4 sm:grid-cols-3">{[['Yêu cầu chờ xử lý', requests.filter((item) => item.status === 'PENDING').length, '/landlord/requests'], ['Hợp đồng chờ cọc', tenancies.filter((item) => item.status === 'PENDING').length, '/landlord/tenants'], ['Hợp đồng đang thuê', tenancies.filter((item) => item.status === 'ACTIVE').length, '/landlord/tenants']].map(([label, count, href]) => <Link key={label} href={String(href)} className="rounded-2xl border border-line p-6"><span className="text-sm text-muted">{label}</span><strong className="mt-3 block text-3xl">{count}</strong></Link>)}</div></section>;
}
