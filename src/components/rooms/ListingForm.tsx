'use client';

import { useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { ListingValidationError, validateListingInput, type ListingFieldErrors } from '@/lib/listing-validation';
import { saveListing, type CatalogRoom, type ListingInput, type propertyFixtures } from '@/services/mock/rooms';
import ListingPreview from './ListingPreview';
import { ListingPhoto, ListingStatus } from './ListingVisuals';

type NumberField = 'area' | 'basePrice' | 'depositAmount' | 'maxTenants';
type FormValues = Omit<ListingInput, NumberField> & Record<NumberField, string>;
const amenities = [
  ['hasPrivateBathroom', 'WC riêng'], ['hasAirConditioner', 'Điều hòa'],
  ['hasWaterHeater', 'Nóng lạnh'], ['hasBalcony', 'Ban công'],
] as const;
const numberValue = (value: string) => value.trim() === '' ? NaN : Number(value);

function toInput(value: FormValues): ListingInput {
  return { ...value, area: numberValue(value.area), basePrice: numberValue(value.basePrice), depositAmount: numberValue(value.depositAmount), maxTenants: numberValue(value.maxTenants) };
}

export default function ListingForm({ current, floors }: { current?: CatalogRoom; floors: typeof propertyFixtures }) {
  const router = useRouter();
  const toast = useToast();
  const detail = current?.detail;
  const [value, setValue] = useState<FormValues>(() => ({
    houseId: detail?.houseId ?? floors[0].houseId, floorId: detail?.floorId ?? floors[0].floorId,
    roomNumber: detail?.roomNumber ?? '', title: detail?.title ?? '', description: detail?.description ?? '',
    area: detail ? String(detail.area) : '', basePrice: detail ? String(detail.rentalPrice) : '',
    depositAmount: detail ? String(detail.depositAmount) : '0', maxTenants: detail ? String(detail.maxTenants) : '1',
    availableFrom: detail?.availableFrom ?? '', amenitiesDescription: detail?.amenitiesDescription ?? '',
    hasPrivateBathroom: detail?.hasPrivateBathroom ?? false, hasAirConditioner: detail?.hasAirConditioner ?? false,
    hasWaterHeater: detail?.hasWaterHeater ?? false, hasBalcony: detail?.hasBalcony ?? false,
  }));
  const [newImages, setNewImages] = useState<string[]>([]);
  const [readingImages, setReadingImages] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<ListingFieldErrors>({});
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState('');
  const savingRef = useRef(false);
  const input = toInput(value);
  const selectedFloor = floors.find((floor) => floor.floorId === value.floorId);
  const houses = [...new Map(floors.map((floor) => [floor.houseId, floor])).values()];
  const availableFloors = floors.filter((floor) => floor.houseId === value.houseId);
  const savedImages = detail?.imageUrls ?? [];
  const images = [...savedImages, ...newImages];

  const change = <K extends keyof FormValues>(key: K, next: FormValues[K]) => {
    setValue((previous) => ({ ...previous, [key]: next }));
    setFields((previous) => ({ ...previous, [key]: undefined }));
    setError('');
  };
  const reportFields = (errors: ListingFieldErrors) => {
    setFields(errors);
    setError('Kiểm tra các trường được đánh dấu trước khi lưu nháp.');
    const first = Object.keys(errors)[0];
    if (first) document.getElementById(`listing-${first}`)?.focus();
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (readingImages || savingRef.current) return;
    const errors = validateListingInput(input);
    if (Object.keys(errors).length) { reportFields(errors); return; }
    savingRef.current = true;
    setSaving(true);
    setError('');
    try {
      saveListing(input, newImages, detail?.roomId);
      toast.push('Đã lưu tin nháp', 'Tin chưa công khai. Bạn có thể gửi duyệt khi đã sẵn sàng.');
      router.push('/landlord/listings');
    } catch (cause) {
      savingRef.current = false;
      setSaving(false);
      if (cause instanceof ListingValidationError) reportFields(cause.fields);
      else setError(cause instanceof Error ? cause.message : 'Không thể lưu tin. Vui lòng thử lại.');
    }
  };
  const readImages = async (files: File[]) => {
    if (!files.length) return;
    setImageError('');
    setReadingImages(true);
    try {
      if (files.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 1024 * 1024)) {
        throw new Error('Chọn ảnh JPG, PNG hoặc WebP, tối đa 1 MB mỗi ảnh. Các ảnh đã chọn trước đó vẫn được giữ.');
      }
      const urls = await Promise.all(files.map((file) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Không thể đọc ảnh. Vui lòng chọn lại.'));
        reader.readAsDataURL(file);
      })));
      setNewImages((previous) => [...previous, ...urls]);
    } catch (cause) {
      setImageError(cause instanceof Error ? cause.message : 'Không thể đọc ảnh. Vui lòng chọn lại.');
    } finally {
      setReadingImages(false);
    }
  };

  return (
    <div className="space-y-7 pb-6">
      <header>
        <Link href="/landlord/listings" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-primary"><span aria-hidden="true">←</span>Tin đăng của tôi</Link>
        <div className="mt-5 flex flex-wrap items-center gap-3"><h1 className="text-[28px] font-extrabold tracking-tight sm:text-[32px]">{current ? 'Chỉnh sửa phòng & tin' : 'Tạo phòng & tin nháp'}</h1><ListingStatus status={current?.postStatus ?? 'DRAFT'} /></div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Một tin rõ ràng giúp người thuê dễ chọn hơn. Bắt đầu với thông tin phòng, rồi thêm nội dung và hình ảnh.</p>
      </header>
      {current?.postStatus === 'REJECTED' && <div className="rounded-xl border border-red-100 bg-red-50 p-4"><h2 className="text-sm font-bold text-red-900">Tin cần điều chỉnh</h2><p className="mt-1 break-words text-sm text-red-800">{current.rejectReason || 'Vui lòng kiểm tra lại thông tin trước khi gửi duyệt.'}</p><p className="mt-2 text-xs text-red-800">Sau khi lưu chỉnh sửa, tin trở về bản nháp để bạn kiểm tra và gửi lại.</p></div>}

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <form noValidate onSubmit={submit} className="min-w-0 space-y-6" aria-busy={saving || readingImages}>
          <FormSection title="Vị trí & thông tin phòng" description="Chọn nhà và tầng thuộc tài khoản của bạn.">
            <div className="grid gap-4 sm:grid-cols-2">
              <label htmlFor="listing-houseId" className="block text-[13px] font-semibold">Nhà<select id="listing-houseId" name="houseId" className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-3 text-sm font-normal" value={value.houseId} onChange={(event) => {
                const floor = floors.find((item) => item.houseId === event.target.value);
                if (floor) { setValue((previous) => ({ ...previous, houseId: floor.houseId, floorId: floor.floorId })); setFields((previous) => ({ ...previous, roomNumber: undefined })); setError(''); }
              }}>{houses.map((house) => <option key={house.houseId} value={house.houseId}>{house.houseName}</option>)}</select></label>
              <label htmlFor="listing-floorId" className="block text-[13px] font-semibold">Tầng<select id="listing-floorId" name="floorId" className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-3 text-sm font-normal" value={value.floorId} onChange={(event) => { change('floorId', event.target.value); setFields((previous) => ({ ...previous, roomNumber: undefined })); }}>{availableFloors.map((floor) => <option key={floor.floorId} value={floor.floorId}>{floor.floorName}</option>)}</select></label>
              <FormField name="roomNumber" label="Số phòng" placeholder="Ví dụ: 302" required maxLength={50} value={value.roomNumber} error={fields.roomNumber} onChange={(event) => change('roomNumber', event.target.value)} />
              <FormField name="area" label="Diện tích (m²)" placeholder="Ví dụ: 25" type="number" required min="0.01" step="any" value={value.area} error={fields.area} onChange={(event) => change('area', event.target.value)} />
              <FormField name="maxTenants" label="Số người tối đa" type="number" required min="1" step="1" value={value.maxTenants} error={fields.maxTenants} onChange={(event) => change('maxTenants', event.target.value)} />
            </div>
          </FormSection>

          <FormSection title="Giá thuê & thời gian" description="Giúp người thuê chủ động ngân sách và kế hoạch chuyển đến.">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField name="basePrice" label="Giá thuê (đ/tháng)" placeholder="Ví dụ: 3500000" type="number" required min="0" step="any" value={value.basePrice} error={fields.basePrice} onChange={(event) => change('basePrice', event.target.value)} />
              <FormField name="depositAmount" label="Tiền đặt cọc (đ)" type="number" required min="0" step="any" value={value.depositAmount} error={fields.depositAmount} onChange={(event) => change('depositAmount', event.target.value)} />
              <FormField name="availableFrom" label="Ngày có thể thuê" type="date" required value={value.availableFrom} error={fields.availableFrom} onChange={(event) => change('availableFrom', event.target.value)} />
            </div>
            <p className="mt-4 text-xs leading-5 text-muted">Có thể lưu nháp với giá 0. Giá thuê phải lớn hơn 0 trước khi gửi duyệt.</p>
          </FormSection>

          <FormSection title="Nội dung & tiện ích" description="Mô tả đúng căn phòng và những tiện ích người thuê sẽ sử dụng.">
            <div className="space-y-5">
              <FormField name="title" label="Tiêu đề tin đăng" placeholder="Ví dụ: Phòng 25 m² có ban công tại Cầu Giấy" required maxLength={200} value={value.title} error={fields.title} onChange={(event) => change('title', event.target.value)} />
              <div><label htmlFor="listing-description" className="mb-1.5 block text-[13px] font-semibold">Mô tả phòng</label><textarea id="listing-description" name="description" required rows={5} placeholder="Không gian, nội thất, khu vực xung quanh và những điều người thuê cần biết…" aria-invalid={!!fields.description} aria-describedby={fields.description ? 'listing-description-error' : undefined} className={cn('w-full resize-y rounded-xl border bg-white px-4 py-3 text-sm leading-6 placeholder:text-muted', fields.description ? 'border-red-500' : 'border-line')} value={value.description} onChange={(event) => change('description', event.target.value)} /><FieldError name="description" error={fields.description} /></div>
              <fieldset><legend className="mb-3 text-[13px] font-semibold">Tiện ích có sẵn</legend><div className="grid grid-cols-2 gap-3">{amenities.map(([key, label]) => <label key={key} className={cn('flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-3 text-sm transition', value[key] ? 'border-primary/30 bg-primary-soft text-primary-dark' : 'border-line hover:bg-page')}><input type="checkbox" checked={value[key]} onChange={(event) => change(key, event.target.checked)} className="h-4 w-4 accent-primary" />{label}</label>)}</div></fieldset>
              <FormField name="amenitiesDescription" label="Tiện ích khác (không bắt buộc)" placeholder="Ví dụ: chỗ để xe, máy giặt dùng chung…" maxLength={3000} value={value.amenitiesDescription} error={fields.amenitiesDescription} onChange={(event) => change('amenitiesDescription', event.target.value)} />
            </div>
          </FormSection>

          <FormSection title="Hình ảnh phòng" description="Ảnh đầu tiên là ảnh đại diện. Ưu tiên ảnh rõ, đủ sáng và đúng thực tế.">
            <label htmlFor="listing-images" className="block cursor-pointer rounded-xl border border-dashed border-primary/30 bg-primary-soft/40 p-5 text-center">
              <svg className="mx-auto mb-3 text-primary" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M12 16V3m-5 5 5-5 5 5M4 15v5h16v-5" /></svg>
              <span className="block text-sm font-semibold text-primary">Thêm ảnh phòng</span><span className="mt-1 block text-xs leading-5 text-muted">JPG, PNG hoặc WebP · tối đa 1 MB/ảnh</span>
              <input id="listing-images" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={readingImages || saving} aria-describedby={imageError ? 'listing-images-error' : undefined} className="mt-4 block w-full text-xs text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:font-semibold file:text-primary" onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                event.target.value = '';
                void readImages(files);
              }} />
            </label>
            {readingImages && <p role="status" className="mt-3 text-sm text-muted">Đang đọc ảnh…</p>}
            {imageError && <p id="listing-images-error" role="alert" className="mt-3 text-sm text-red-600">{imageError}</p>}
            {images.length > 0 && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{images.map((src, index) => <div key={`${index}-${src.slice(-24)}`} className="min-w-0">
              <ListingPhoto src={src} alt={`Ảnh phòng ${index + 1}`} className="aspect-[4/3] rounded-xl" />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-xs"><span className="text-muted">{index === 0 ? 'Ảnh đại diện' : index < savedImages.length ? 'Đã lưu' : 'Ảnh mới'}</span>{index >= savedImages.length && <button type="button" disabled={readingImages || saving} aria-label={`Bỏ ảnh mới ${index - savedImages.length + 1}`} className="rounded px-1 py-1 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50" onClick={() => setNewImages((previous) => previous.filter((_, imageIndex) => imageIndex !== index - savedImages.length))}>Bỏ ảnh</button>}</div>
            </div>)}</div>}
            <p className="mt-4 text-xs leading-5 text-muted">{savedImages.length} ảnh đã lưu · {newImages.length} ảnh mới. Ảnh mới được thêm sau ảnh đã lưu; cần ít nhất một ảnh để gửi duyệt.</p>
          </FormSection>

          <div className="space-y-4 rounded-2xl border border-line bg-white p-5">
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <div className="flex flex-wrap items-center justify-between gap-4"><p className="text-xs leading-5 text-muted">Lưu nháp không đồng nghĩa với đăng công khai.</p><div className="flex gap-3"><Button type="button" variant="outline" disabled={saving} onClick={() => router.push('/landlord/listings')}>Hủy</Button><Button type="submit" disabled={saving || readingImages}>{saving ? 'Đang lưu…' : 'Lưu nháp'}</Button></div></div>
          </div>
        </form>
        <ListingPreview value={input} images={images} floor={selectedFloor} />
      </div>
    </div>
  );
}

function FormSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="rounded-2xl border border-line bg-white p-5 sm:p-6"><div className="mb-5"><h2 className="text-base font-bold tracking-tight">{title}</h2><p className="mt-1 text-xs leading-5 text-muted">{description}</p></div>{children}</section>;
}

function FieldError({ name, error }: { name: string; error?: string }) {
  return error ? <p id={`listing-${name}-error`} className="mt-1.5 text-xs leading-5 text-red-600">{error}</p> : null;
}

function FormField({ error, name, ...props }: ComponentProps<typeof Input> & { error?: string; name: keyof ListingInput }) {
  return <div><Input {...props} name={name} id={`listing-${name}`} aria-invalid={!!error} aria-describedby={error ? `listing-${name}-error` : undefined} className={error ? 'border-red-500' : undefined} /><FieldError name={name} error={error} /></div>;
}
