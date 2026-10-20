import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import TenantShell from '@/components/layouts/TenantShell';
import Card from '@/components/ui/Card';
import RoomDetailActions from './RoomDetailActions';
import { rooms, landlord } from '@/lib/data';
import { formatPriceShort, roomStatusLabel } from '@/lib/utils';

export function generateStaticParams() {
  return rooms.map((r) => ({ id: String(r.id) }));
}

// A2 reference breakdown (Phòng 302): điện 350.000đ, nước 100.000đ, phí dịch vụ 100.000đ → tổng 3.350.000đ
const ELECTRIC = 350000;
const WATER = 100000;
const SERVICE = 100000;

export default async function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const room = rooms.find((r) => r.id === Number(id));
  if (!room) notFound();

  const gallery = room.gallery && room.gallery.length > 0 ? room.gallery : [room.image];
  const total = room.price + ELECTRIC + WATER + SERVICE;

  const breakdown = [
    { label: 'Tiền phòng', amount: room.price },
    { label: 'Điện (ước tính)', amount: ELECTRIC },
    { label: 'Nước', amount: WATER },
    { label: 'Phí dịch vụ', amount: SERVICE },
  ];

  const specs = [
    { label: 'Diện tích', value: `${room.size} m²` },
    { label: 'Tầng', value: `Tầng ${room.floor}` },
    { label: 'Tối đa', value: '2 người' },
    { label: 'Đặt cọc', value: '1 tháng' },
  ];

  const otherRooms = rooms.filter((r) => r.id !== room.id).slice(0, 2);
  const sleepImages = [gallery[0], gallery[1] ?? room.image, gallery[2] ?? gallery[0]];

  return (
    <TenantShell>
      <div className="mx-auto w-full max-w-[1180px] px-6 py-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
          Quay lại
        </Link>

        <h1 className="mt-3 text-[28px] font-extrabold text-ink">Phòng {room.code} — {room.house}</h1>

        {/* Mosaic gallery */}
        <div className="mt-6 grid h-[300px] grid-cols-3 grid-rows-2 gap-2 sm:h-[420px]">
          <div className="relative col-span-3 overflow-hidden rounded-2xl sm:col-span-2 sm:row-span-2">
            <Image src={gallery[0]} alt={room.name} fill sizes="(max-width: 640px) 100vw, 66vw" className="object-cover" priority />
          </div>
          <div className="relative hidden overflow-hidden rounded-2xl sm:block">
            <Image src={gallery[1] ?? room.image} alt={room.name} fill sizes="33vw" className="object-cover" />
          </div>
          <div className="relative hidden overflow-hidden rounded-2xl sm:block">
            <Image src={gallery[2] ?? room.image} alt={room.name} fill sizes="33vw" className="object-cover" />
          </div>
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-3">
          {/* Content */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-soft text-base font-bold text-primary">{landlord.initials}</span>
              <div>
                <p className="font-bold text-ink">{landlord.name}</p>
                <p className="mt-0.5 text-sm text-muted">Chủ trọ · 12 phòng đang cho thuê</p>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-xl bg-primary-soft px-5 py-4">
              <svg className="mt-0.5 shrink-0 text-primary" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2l1.9 5.7L20 9.6l-6.1 1.9L12 17.2l-1.9-5.7L4 9.6l6.1-1.9z" /></svg>
              <p className="text-sm leading-relaxed text-ink">
                <span className="font-bold">AI TÓM TẮT</span>
                <span className="text-muted"> · </span>
                Phòng sáng, đủ tiện ích cho 2 người, giá thấp hơn mặt bằng khu vực 8%.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-2xl border border-line sm:grid-cols-4">
              {specs.map((s) => (
                <div key={s.label} className="px-5 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{s.label}</p>
                  <p className="mt-1.5 text-[15px] font-bold text-ink">{s.value}</p>
                </div>
              ))}
            </div>

            <ul className="mt-6 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {room.amenities.map((a) => (
                <li key={a} className="text-[15px] text-ink">{a}</li>
              ))}
            </ul>

            <h2 className="mt-9 text-lg font-bold text-ink">Nơi bạn sẽ ngủ</h2>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {sleepImages.map((src, i) => (
                <div key={i} className="relative h-[110px] overflow-hidden rounded-xl">
                  <Image src={src} alt={room.name} fill sizes="33vw" className="object-cover" />
                </div>
              ))}
            </div>

            <p className="mt-8 text-[15px] leading-relaxed text-ink">
              {room.name} thuộc {room.house}, khu vực {room.area} — phòng rộng {room.size} m² ở tầng {room.floor},
              thoáng sáng, nội thất cơ bản đầy đủ và sẵn sàng dọn vào ở ngay. Khu nhà an ninh, giờ giấc tự do,
              gần chợ, siêu thị và các trục đường chính nên đi học, đi làm đều thuận tiện.
            </p>
          </div>

          {/* Sticky booking column */}
          <div>
            <div className="lg:sticky lg:top-24">
              <Card className="p-5">
                <p className="text-[15px] font-bold text-ink">Phòng khác của chủ trọ</p>
                <div className="mt-3 space-y-2.5">
                  {otherRooms.map((r) => (
                    <Link key={r.id} href={`/rooms/${r.id}`} className="block text-sm text-muted transition hover:text-ink">
                      Phòng {r.code} · {formatPriceShort(r.price)} · {roomStatusLabel[r.status]}
                    </Link>
                  ))}
                </div>
              </Card>

              <div className="mt-5">
                <RoomDetailActions room={room} breakdown={breakdown} total={total} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </TenantShell>
  );
}
