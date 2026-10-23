'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useCatalog } from '@/hooks/useCatalog';
import { propertyFixtures, saveListing, type CatalogRoom, type ListingInput } from '@/services/mock/rooms';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ListingEditor({ roomId }: { roomId?: string }) {
  const { user, openAuth } = useAuth();
  const { items, ready, error } = useCatalog();
  if (!ready) return <p>Đang tải…</p>;
  if (error) return <p role="alert">{error}</p>;
  if (user?.role !== 'LANDLORD') return <Button onClick={() => openAuth('login', 'landlord')}>Đăng nhập chủ trọ</Button>;
  const current = items.find((r) => r.detail.roomId === roomId && r.landlordId === user.id);
  if (roomId && (!current || !['DRAFT', 'REJECTED'].includes(current.postStatus))) return <p>Không tìm thấy tin có thể chỉnh sửa.</p>;
  const floors = propertyFixtures.filter((p) => p.landlordId === user.id);
  if (!floors.length) return <p>Chưa có nhà và tầng được cấp cho tài khoản. Vui lòng liên hệ quản trị viên.</p>;
  return <Editor key={roomId ?? 'new'} current={current} floors={floors} />;
}
function Editor({ current, floors }: { current?: CatalogRoom; floors: typeof propertyFixtures }) {
  const router = useRouter(); const d = current?.detail;
  const [value, setValue] = useState<ListingInput>({
    houseId: d?.houseId ?? floors[0].houseId, floorId: d?.floorId ?? floors[0].floorId,
    roomNumber: d?.roomNumber ?? '', title: d?.title ?? '', description: d?.description ?? '',
    area: d?.area ?? 20, basePrice: d?.rentalPrice ?? 0, depositAmount: d?.depositAmount ?? 0,
    maxTenants: d?.maxTenants ?? 1, availableFrom: d?.availableFrom ?? '', amenitiesDescription: d?.amenitiesDescription ?? '',
    hasPrivateBathroom: d?.hasPrivateBathroom ?? false, hasAirConditioner: d?.hasAirConditioner ?? false,
    hasWaterHeater: d?.hasWaterHeater ?? false, hasBalcony: d?.hasBalcony ?? false,
  });
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const change = <K extends keyof ListingInput>(key: K, v: ListingInput[K]) => setValue((old) => ({ ...old, [key]: v }));
  const submit = (event: FormEvent) => {
    event.preventDefault(); if (busy) return;
    try { saveListing(value, images, d?.roomId); router.push('/landlord/listings'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không thể lưu tin.'); }
  };
  return <div className="max-w-3xl space-y-5"><h1 className="text-[28px] font-extrabold">{current ? 'Chỉnh sửa phòng & tin' : 'Tạo phòng & tin nháp'}</h1>
    <p className="text-sm text-muted">Lưu nháp trước, sau đó gửi duyệt từ danh sách tin đăng.</p>
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-line bg-white p-5">
      <label className="block text-sm font-semibold">Nhà / tầng<select className="mt-2 w-full rounded-xl border border-line bg-white p-3" value={value.floorId} onChange={(e) => { const floor = floors.find((f) => f.floorId === e.target.value)!; setValue((old) => ({ ...old, houseId: floor.houseId, floorId: floor.floorId })); }}>{floors.map((f) => <option key={f.floorId} value={f.floorId}>{f.houseName} — {f.floorName}</option>)}</select></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="roomNumber" label="Số phòng" required maxLength={50} value={value.roomNumber} onChange={(e) => change('roomNumber', e.target.value)} />
        <Input name="area" label="Diện tích (m²)" type="number" required min="0.01" step="any" value={value.area} onChange={(e) => change('area', Number(e.target.value))} />
        <Input name="basePrice" label="Giá thuê (đ/tháng)" type="number" required min="0" value={value.basePrice} onChange={(e) => change('basePrice', Number(e.target.value))} />
        <Input name="depositAmount" label="Tiền cọc (đ)" type="number" required min="0" value={value.depositAmount} onChange={(e) => change('depositAmount', Number(e.target.value))} />
        <Input name="maxTenants" label="Số người tối đa" type="number" required min="1" step="1" value={value.maxTenants} onChange={(e) => change('maxTenants', Number(e.target.value))} />
        <Input name="availableFrom" label="Ngày có thể thuê" type="date" required value={value.availableFrom} onChange={(e) => change('availableFrom', e.target.value)} />
      </div>
      <Input name="title" label="Tiêu đề" required maxLength={200} value={value.title} onChange={(e) => change('title', e.target.value)} />
      <label className="block text-sm font-semibold">Mô tả<textarea required rows={4} value={value.description} onChange={(e) => change('description', e.target.value)} className="mt-2 w-full rounded-xl border border-line p-3" /></label>
      <fieldset><legend className="mb-3 text-sm font-semibold">Tiện ích</legend><div className="grid grid-cols-2 gap-3">{([['hasPrivateBathroom', 'WC riêng'], ['hasAirConditioner', 'Điều hòa'], ['hasWaterHeater', 'Nóng lạnh'], ['hasBalcony', 'Ban công']] as const).map(([key, label]) => <label key={key} className="flex gap-2 text-sm"><input type="checkbox" checked={value[key]} onChange={(e) => change(key, e.target.checked)} />{label}</label>)}</div></fieldset>
      <Input name="amenitiesDescription" label="Tiện ích khác" maxLength={3000} value={value.amenitiesDescription} onChange={(e) => change('amenitiesDescription', e.target.value)} />
      <label className="block text-sm font-semibold">Thêm ảnh phòng<input className="mt-2 block w-full text-sm" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={async (e) => {
        const files = Array.from(e.target.files ?? []); setError(''); setBusy(true);
        try {
          if (files.some((f) => !['image/jpeg', 'image/png', 'image/webp'].includes(f.type) || f.size > 1024 * 1024)) throw new Error('Chọn ảnh JPG, PNG hoặc WebP, tối đa 1 MB mỗi ảnh trong bản trải nghiệm.');
          const urls = await Promise.all(files.map((file) => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('Không thể đọc ảnh.')); reader.readAsDataURL(file); })));
          setImages(urls);
        } catch (e) { setImages([]); setError(e instanceof Error ? e.message : 'Không thể đọc ảnh.'); }
        finally { setBusy(false); }
      }} /></label>
      <p className="text-xs text-muted">{d?.imageUrls.length ?? 0} ảnh đã lưu · {images.length} ảnh mới. Ảnh mới được thêm vào cuối danh sách; cần ít nhất một ảnh để gửi duyệt.</p>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => router.push('/landlord/listings')}>Hủy</Button><Button type="submit" disabled={busy}>{busy ? 'Đang đọc ảnh…' : 'Lưu nháp'}</Button></div>
    </form>
  </div>;
}
