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

const STEPS = ['Thông tin', 'Ảnh & tiện ích', 'Giá & đăng'];
const ALL_AMENITIES = ['Điều hòa', 'Wifi', 'Máy giặt', 'Ban công', 'Bếp', 'WC riêng', 'Nóng lạnh', 'Tủ lạnh'];
const AI_DESC =
  'Phòng rộng rãi, nhiều ánh sáng tự nhiên, ban công thoáng mát, đầy đủ nội thất cơ bản. Khu dân cư an ninh, gần chợ, trường học và tuyến xe buýt. Giờ giấc tự do, có chỗ để xe trong nhà, không chung chủ.';

const inputCls =
  'w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink placeholder:text-muted/70 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

export default function TaoBaiDangPage() {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [roomId, setRoomId] = useState(rooms[0].id);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(String(rooms[0].price));
  const [amenities, setAmenities] = useState<string[]>(rooms[0].amenities);
  const [feeElec, setFeeElec] = useState('3500');
  const [feeWater, setFeeWater] = useState('12000');
  const [feeService, setFeeService] = useState('100000');

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
          href="/chu-tro/bai-dang"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark"
        >
          Về danh sách bài đăng
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-extrabold text-ink">Tạo bài đăng</h1>
        <p className="mt-1 text-sm text-muted">3 bước: thông tin phòng, ảnh &amp; tiện ích, giá &amp; gửi duyệt</p>
      </div>

      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const state = n < step ? 'done' : n === step ? 'active' : 'todo';
          return (
            <div key={label} className={cn('flex items-center gap-2', i < STEPS.length - 1 && 'flex-1')}>
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                  state === 'todo' ? 'border border-line bg-white text-muted' : 'bg-primary text-white',
                )}
              >
                {state === 'done' ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>
                ) : (
                  n
                )}
              </span>
              <span className={cn('hidden whitespace-nowrap text-sm font-semibold sm:block', state === 'todo' ? 'text-muted' : 'text-ink')}>
                {n}. {label}
              </span>
              {i < STEPS.length - 1 && <span className={cn('mx-2 h-px flex-1', n < step ? 'bg-primary' : 'bg-line')} />}
            </div>
          );
        })}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-6">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label htmlFor="room-select" className="mb-1.5 block text-sm font-medium text-ink">Chọn phòng</label>
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
              <Input label="Tiêu đề bài đăng" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ví dụ: Phòng 302 — Lê Văn Lương, full nội thất" />
              <div>
                <label htmlFor="desc" className="mb-1.5 block text-sm font-medium text-ink">Mô tả</label>
                <textarea id="desc" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả phòng, tiện ích xung quanh, quy định nhà trọ..." className={inputCls} />
              </div>
              <div className="rounded-2xl border border-sky-light bg-sky-pale p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-sea-dark">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 5.8L20 9.7l-6.1 1.9L12 17.4l-1.9-5.8L4 9.7l6.1-1.9L12 2z" /><path d="M19 15l.9 2.6L22.5 18.5l-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9L19 15z" /></svg>
                  AI gợi ý mô tả
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{AI_DESC}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setDescription(AI_DESC)}>Dùng gợi ý này</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <p className="mb-2 text-sm font-semibold text-ink">Ảnh phòng</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {photos.map((src, i) => (
                    <div key={src} className="relative">
                      <Image src={src} alt={`Ảnh phòng ${i + 1}`} width={300} height={300} className="aspect-square w-full rounded-xl object-cover" />
                      {i === 0 && (
                        <span className="absolute left-2 top-2 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-white">Ảnh bìa</span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[13px] text-muted">Ảnh đầu tiên sẽ là ảnh bìa của bài đăng.</p>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-ink">Tiện ích</p>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {ALL_AMENITIES.map((a) => (
                    <label
                      key={a}
                      className={cn(
                        'flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm transition',
                        amenities.includes(a) ? 'border-primary bg-primary-soft font-medium text-ink' : 'border-line text-muted hover:border-primary/50',
                      )}
                    >
                      <input type="checkbox" checked={amenities.includes(a)} onChange={() => toggleAmenity(a)} className="h-4 w-4 accent-[#4F46E5]" />
                      {a}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <Input label="Giá thuê (đ/tháng)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
              <div className="flex gap-3 rounded-2xl bg-primary-soft p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-primary">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 5.8L20 9.7l-6.1 1.9L12 17.4l-1.9-5.8L4 9.7l6.1-1.9L12 2z" /></svg>
                </span>
                <div>
                  <p className="text-sm font-bold text-primary-dark">Giá gợi ý AI: 2,8 tr/tháng</p>
                  <p className="mt-0.5 text-[13px] text-muted">Theo 24 phòng quanh Lê Văn Lương có diện tích và tiện ích tương tự.</p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-ink">Phí dịch vụ</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input label="Điện (đ/số)" type="number" value={feeElec} onChange={(e) => setFeeElec(e.target.value)} />
                  <Input label="Nước (đ/khối)" type="number" value={feeWater} onChange={(e) => setFeeWater(e.target.value)} />
                  <Input label="Dịch vụ (đ/tháng)" type="number" value={feeService} onChange={(e) => setFeeService(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
            <Button variant="outline" disabled={step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))}>Quay lại</Button>
            {step < 3 ? (
              <Button onClick={() => setStep((s) => Math.min(3, s + 1))}>Tiếp tục</Button>
            ) : (
              <Button onClick={() => setDone(true)}>Gửi duyệt</Button>
            )}
          </div>
        </Card>

        <Card className="p-4 lg:sticky lg:top-24">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Xem trước</p>
          <Image src={selected.image} alt={selected.name} width={640} height={480} className="mt-3 aspect-[4/3] w-full rounded-xl object-cover" />
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
  );
}
