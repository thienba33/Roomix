'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { rooms } from '@/lib/data';
import { cn, formatPriceShort, roomStatusLabel, roomStatusTone } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const ALL_AMENITIES = ['Điều hòa', 'Wifi', 'Máy giặt', 'Ban công', 'Gửi xe', 'Bếp', 'WC riêng', 'Nóng lạnh', 'Tủ lạnh'];
const AI_DESC =
  'Phòng rộng rãi, nhiều ánh sáng tự nhiên, ban công thoáng mát, đầy đủ nội thất cơ bản. Khu dân cư an ninh, gần chợ, trường học và tuyến xe buýt. Giờ giấc tự do, có chỗ để xe trong nhà, không chung chủ.';

const inputCls =
  'w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink placeholder:text-muted/70 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

const STEP_CHIPS = ['1 · Chọn nhà & phòng', '2 · Ảnh & tiện ích', '3 · Giá & mô tả'];

export default function TaoBaiDangPage() {
  const [done, setDone] = useState(false);
  const [roomId, setRoomId] = useState(rooms[0].id);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(String(rooms[0].price));
  const [amenities, setAmenities] = useState<string[]>(rooms[0].amenities);

  const selected = rooms.find((r) => r.id === roomId) ?? rooms[0];
  const photos = Array.from(new Set([...(selected.gallery ?? [selected.image]), ...rooms.map((r) => r.image)])).slice(0, 4);

  const toggleAmenity = (a: string) =>
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  if (done) {
    return (
      <Card className="mx-auto max-w-lg p-10 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>
        </span>
        <h2 className="mt-5 text-xl font-extrabold text-ink">Bài đăng đã gửi duyệt</h2>
        <p className="mt-2 text-sm text-muted">Admin sẽ kiểm duyệt bài đăng của bạn. Bạn sẽ nhận được thông báo khi bài đăng được duyệt.</p>
        <Link
          href="/landlord/listings"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark"
        >
          Về danh sách bài đăng
        </Link>
      </Card>
    );
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold text-ink">Tạo bài đăng</h1>
        <p className="mt-1 text-sm text-muted">Bài mới sẽ ở trạng thái chờ kiểm duyệt</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {STEP_CHIPS.map((label, i) => (
          <span
            key={label}
            className={cn(
              'flex h-7 items-center rounded-full px-3 text-xs font-medium',
              i === 0 ? 'bg-primary-soft text-primary' : 'bg-[#F7F7F7] text-muted',
            )}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-6">
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="room-select" className="mb-1.5 block text-[13px] font-semibold text-ink">Chọn phòng</label>
                <select
                  id="room-select"
                  value={roomId}
                  onChange={(e) => {
                    const r = rooms.find((x) => x.id === Number(e.target.value));
                    setRoomId(Number(e.target.value));
                    if (r) {
                      setPrice(String(r.price));
                      setAmenities(r.amenities);
                    }
                  }}
                  className={inputCls}
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Phòng {r.code} — {r.area} · {formatPriceShort(r.price)}/tháng
                    </option>
                  ))}
                </select>
              </div>
              <Input label="Giá thuê (đ/tháng)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>

            <Input label="Tiêu đề bài đăng" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ví dụ: Phòng 302 — Lê Văn Lương, full nội thất" />

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="desc" className="text-[13px] font-semibold text-ink">Mô tả</label>
                <Button type="button" variant="outline" size="sm" onClick={() => setDescription(AI_DESC)}>AI gợi ý</Button>
              </div>
              <textarea id="desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả phòng, tiện ích xung quanh, quy định nhà trọ..." className={inputCls} />
            </div>

            <div>
              <p className="mb-2 text-[13px] font-semibold text-ink">Tiện ích</p>
              <div className="flex flex-wrap gap-2">
                {ALL_AMENITIES.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAmenity(a)}
                    className={cn(
                      'flex h-7 items-center rounded-full border px-3 text-xs font-medium transition',
                      amenities.includes(a)
                        ? 'border-transparent bg-primary-soft text-primary'
                        : 'border-line bg-white text-muted',
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[13px] font-semibold text-ink">Ảnh phòng</p>
              <button type="button" className="flex h-11 w-full items-center rounded-xl border border-dashed border-line bg-page px-4 text-sm text-muted">
                + Tải ảnh lên (tối đa 8 ảnh)
              </button>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {photos.map((src, i) => (
                  <div key={src} className="relative">
                    <Image src={src} alt={`Ảnh phòng ${i + 1}`} width={300} height={300} className="aspect-square w-full rounded-xl object-cover" />
                    {i === 0 && (
                      <span className="absolute left-2 top-2 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-white">Ảnh bìa</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Link href="/landlord/listings">
              <Button type="button" variant="outline">Quay lại</Button>
            </Link>
            <Button type="button" onClick={() => setDone(true)}>Gửi duyệt</Button>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="font-semibold text-ink">Gợi ý giá AI</h3>
            <p className="mt-3 text-sm text-muted">Giá thị trường khu Thanh Xuân:</p>
            <p className="mt-1 font-semibold text-ink">2,7 – 3,0 tr / tháng</p>
            <p className="mt-4 text-sm text-muted">Đề xuất cho phòng này</p>
            <p className="mt-1 text-2xl font-extrabold text-ink">2,8 tr / tháng</p>
            <Button type="button" className="mt-4 w-full" onClick={() => setPrice('2800000')}>Áp dụng giá đề xuất</Button>
            <p className="mt-3 text-xs text-muted">Dựa trên 48 phòng cùng khu vực</p>
          </Card>

          <div>
            <p className="text-[13px] font-medium text-muted">Xem trước như khách thấy</p>
            <Card className="mt-3 p-4">
              <Image src={selected.image} alt={selected.name} width={640} height={480} className="aspect-[4/3] w-full rounded-xl object-cover" />
              <h3 className="mt-3 font-semibold text-ink">{title.trim() || selected.name}</h3>
              <p className="mt-1 text-[15px]">
                <span className="font-bold text-ink">{formatPriceShort(Number(price) || selected.price)}</span>
                <span className="text-muted"> / tháng</span>
              </p>
              <p className="mt-0.5 text-sm text-muted">{selected.size} m² · Tầng {selected.floor} · {selected.area}</p>
              <div className="mt-2.5">
                <Badge tone={roomStatusTone[selected.status]} dot>{roomStatusLabel[selected.status]}</Badge>
              </div>
              {amenities.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {amenities.slice(0, 4).map((a) => (
                    <span key={a} className="rounded-full bg-page px-2.5 py-1 text-xs text-muted">{a}</span>
                  ))}
                  {amenities.length > 4 && <span className="rounded-full bg-page px-2.5 py-1 text-xs text-muted">+{amenities.length - 4}</span>}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
