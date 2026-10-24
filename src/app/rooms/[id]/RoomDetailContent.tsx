'use client';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import TenantShell from '@/components/layouts/TenantShell';
import { useCatalog } from '@/hooks/useCatalog';
import { formatVND } from '@/lib/utils';
import RoomDetailActions from './RoomDetailActions';

export default function RoomDetailContent({ id }: { id: string }) {
  const { items, ready, error, retry } = useCatalog();
  if (!ready) return <TenantShell><p role="status" className="p-8">Đang tải thông tin phòng…</p></TenantShell>;
  const room = items.find((r) => r.detail.roomId === id && r.postStatus === 'APPROVED')?.detail;
  if (error || !room) return <TenantShell><div className="p-10 text-center"><h1 className="text-2xl font-bold">{error || 'Tin đăng không còn khả dụng'}</h1>{error && <Button onClick={retry} variant="outline" className="mx-auto mt-5">Thử lại</Button>}<Link href="/" className="mt-5 inline-block text-primary">Về trang tìm phòng</Link></div></TenantShell>;
  return <TenantShell><div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6">
    <Link href="/" className="text-sm font-semibold text-primary">← Quay lại tìm phòng</Link>
    <h1 className="mt-4 text-[28px] font-extrabold text-ink">{room.title}</h1>
    <p className="mt-2 text-sm text-muted">{[room.addressStreet, room.ward, room.district, room.city].filter(Boolean).join(', ')}</p>
    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {room.imageUrls.map((src, i) => <div key={`${src}-${i}`} className="relative aspect-[3/2] overflow-hidden rounded-2xl"><Image src={src} alt={`${room.title} — ảnh ${i + 1}`} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" priority={i === 0} /></div>)}
    </div>
    <div className="mt-8 grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h2 className="text-xl font-bold">Thông tin phòng</h2>
        <dl className="mt-4 grid grid-cols-2 gap-5 rounded-2xl border border-line p-5">
          {[['Diện tích', `${room.area} m²`], ['Tầng', room.floorName], ['Số người tối đa', String(room.maxTenants)], ['Tiền đặt cọc', formatVND(room.depositAmount)], ['Ngày có thể thuê', room.availableFrom.split('-').reverse().join('/')], ['Tình trạng', room.available ? 'Chưa cho thuê' : 'Đã cho thuê']].map(([label, value]) => <div key={label}><dt className="text-sm text-muted">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}
        </dl>
        <h2 className="mt-7 text-xl font-bold">Tiện ích</h2><p className="mt-3 leading-7 text-muted">{room.amenitiesDescription}</p>
        <h2 className="mt-7 text-xl font-bold">Mô tả chi tiết</h2><p className="mt-3 whitespace-pre-line leading-7 text-muted">{room.description}</p>
      </div>
      <div><RoomDetailActions detail={room} /></div>
    </div>
  </div></TenantShell>;
}
