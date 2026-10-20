import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import TenantShell from '@/components/layouts/TenantShell';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { rooms, landlord } from '@/lib/data';
import { formatVND, formatPriceShort, formatRating, roomStatusLabel, roomStatusTone } from '@/lib/utils';

export function generateStaticParams() {
  return rooms.map((r) => ({ id: String(r.id) }));
}

const ELECTRIC = 86 * 3500; // 301.000đ
const WATER = 9 * 12000; // 108.000đ
const SERVICE = 141000;

export default async function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const room = rooms.find((r) => r.id === Number(id));
  if (!room) notFound();

  const gallery = room.gallery && room.gallery.length > 0 ? room.gallery : [room.image];
  const total = room.price + ELECTRIC + WATER + SERVICE;

  const breakdown = [
    { label: 'Tiền phòng', detail: 'Mỗi tháng', amount: room.price },
    { label: 'Điện', detail: '86 số × 3.500đ', amount: ELECTRIC },
    { label: 'Nước', detail: '9 khối × 12.000đ', amount: WATER },
    { label: 'Phí dịch vụ', detail: 'Vệ sinh, thang máy, rác', amount: SERVICE },
  ];

  const specs = [
    { label: 'Diện tích', value: `${room.size} m²` },
    { label: 'Giá thuê', value: `${formatPriceShort(room.price)} / tháng` },
    { label: 'Tầng', value: `Tầng ${room.floor}` },
    { label: 'Tình trạng', value: roomStatusLabel[room.status] },
  ];

  return (
    <TenantShell>
      <div className="mx-auto max-w-7xl px-6 py-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
          Tìm phòng
        </Link>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-[28px] font-extrabold text-ink">{room.name} — {room.house}</h1>
          <Badge tone={roomStatusTone[room.status]} dot>{roomStatusLabel[room.status]}</Badge>
        </div>
        <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm text-muted">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#222" aria-hidden><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" /></svg>
          <span className="font-semibold text-ink">{formatRating(room.rating)}</span>
          <span aria-hidden>·</span>
          <span>{room.house} · {room.area}, Hà Nội</span>
        </p>

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
                <p className="font-bold text-ink">Chủ nhà: {landlord.name}</p>
                <p className="mt-0.5 text-sm text-muted">Chủ nhà tại {room.house} · Đã xác minh</p>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-sky-light bg-sky-pale px-5 py-4">
              <svg className="mt-0.5 shrink-0 text-sea" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2l1.9 5.7L20 9.6l-6.1 1.9L12 17.2l-1.9-5.7L4 9.6l6.1-1.9z" /><path d="M19 15.5l.8 2.4 2.4.8-2.4.8-.8 2.4-.8-2.4-2.4-.8 2.4-.8z" /></svg>
              <p className="text-sm leading-relaxed text-ink">
                <span className="font-bold">Tóm tắt AI · </span>
                Phòng sáng, gần trục Lê Văn Lương, chi phí điện nước minh bạch — phù hợp người đi làm.
              </p>
            </div>

            <p className="mt-6 text-[15px] leading-relaxed text-ink">
              {room.name} thuộc {room.house}, khu vực {room.area} — phòng rộng {room.size} m² ở tầng {room.floor},
              thoáng sáng, nội thất cơ bản đầy đủ và sẵn sàng dọn vào ở ngay. Khu nhà an ninh, giờ giấc tự do,
              gần chợ, siêu thị và các trục đường chính nên đi học, đi làm đều thuận tiện.
            </p>

            <h2 className="mt-8 text-lg font-bold text-ink">Tiện ích</h2>
            <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
              {room.amenities.map((a) => (
                <li key={a} className="flex items-center gap-2.5 text-sm text-ink">
                  <svg className="shrink-0 text-green-600" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  {a}
                </li>
              ))}
            </ul>

            <h2 className="mt-8 text-lg font-bold text-ink">Thông số phòng</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {specs.map((s) => (
                <div key={s.label} className="rounded-2xl border border-line px-4 py-3.5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">{s.label}</p>
                  <p className="mt-1 font-bold text-ink">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sticky booking card */}
          <div>
            <div className="lg:sticky lg:top-24">
              <Card className="p-6">
                <p className="text-2xl font-extrabold text-ink">
                  {formatPriceShort(room.price)} <span className="text-base font-medium text-muted">/ tháng</span>
                </p>
                <p className="mt-1 text-[13px] text-muted">Chi phí dự kiến mỗi tháng, ước tính theo chỉ số trung bình</p>

                <div className="mt-5 space-y-3">
                  {breakdown.map((row) => (
                    <div key={row.label} className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-ink">{row.label} <span className="text-muted">· {row.detail}</span></span>
                      <span className="shrink-0 font-medium text-ink">{formatVND(row.amount)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-baseline justify-between border-t border-line pt-4">
                  <span className="font-bold text-ink">Tổng dự kiến/tháng</span>
                  <span className="text-lg font-extrabold text-ink">{formatVND(total)}</span>
                </div>

                <Button size="lg" className="mt-5 w-full">Quan tâm phòng này</Button>
                <p className="mt-3 text-center text-[13px] text-muted">Gửi yêu cầu — chủ trọ phản hồi trong 24 giờ</p>
              </Card>

              <div className="mt-4 rounded-2xl border border-dashed border-line bg-page p-5">
                <p className="flex items-center gap-2 font-bold text-ink">
                  <svg className="shrink-0 text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                  Contact Card
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">Contact Card — mở khóa khi chủ trọ chấp nhận yêu cầu.</p>
                <div className="mt-3 space-y-1.5 text-sm text-muted">
                  <p className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                    09•• ••• 678
                  </p>
                  <p className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>
                    an•••@roomix.vn
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TenantShell>
  );
}
