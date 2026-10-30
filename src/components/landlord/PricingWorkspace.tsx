'use client';
import { useRef, useState, type FormEvent } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { sessionVersion } from '@/services/backend/session';
import { predictRentalPricing, type PricingPredictRequest, type PricingPredictResponse } from '@/services/ai';
import { formatVND } from '@/lib/utils';
import { pricingAnalysisText } from '@/lib/pricing-analysis';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const AMENITIES = ['Máy lạnh', 'Tủ lạnh', 'Máy giặt', 'Bình nóng lạnh', 'Thang máy', 'Ban công', 'Bếp riêng'];
const FEATURES = [['is_mezzanine', 'Có gác lửng'], ['is_studio', 'Dạng studio'], ['has_parking', 'Có chỗ để xe'], ['is_newly_built', 'Mới xây / cải tạo']] as const;
export default function PricingWorkspace() {
  const { user, ready } = useAuth();
  if (!ready) return <p role="status">Đang kiểm tra tài khoản…</p>;
  if (user?.role !== 'LANDLORD') return <p role="alert">Đăng nhập bằng tài khoản chủ trọ để định giá phòng.</p>;
  return <PricingForm key={user.id} />;
}
function PricingForm() {
  const [result, setResult] = useState<PricingPredictResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (lock.current) return;
    const data = new FormData(event.currentTarget);
    const input: PricingPredictRequest = {
      city: String(data.get('city') ?? '').trim(), district: String(data.get('district') ?? '').trim(),
      ward: String(data.get('ward') ?? '').trim() || undefined, room_type: String(data.get('room_type')),
      area_sqm: Number(data.get('area_sqm')), amenities: data.getAll('amenities').map(String),
      floor: data.get('floor') ? Number(data.get('floor')) : undefined,
      is_mezzanine: data.has('is_mezzanine'), is_studio: data.has('is_studio'),
      has_parking: data.has('has_parking'), is_newly_built: data.has('is_newly_built'),
    };
    if (!input.city || !input.district || !Number.isFinite(input.area_sqm) || input.area_sqm <= 5) { setError('Nhập thành phố, quận/huyện và diện tích lớn hơn 5 m².'); return; }
    const version = sessionVersion();
    lock.current = true; setBusy(true); setError(''); setResult(null);
    try { const value = await predictRentalPricing(input); if (sessionVersion() === version) setResult(value); }
    catch (cause) { if (sessionVersion() === version) setError(cause instanceof Error ? cause.message : 'Chưa thể định giá phòng. Vui lòng thử lại.'); }
    finally { lock.current = false; setBusy(false); }
  };
  return <section className="space-y-6 pb-8"><header className="border-b border-line pb-5"><h1 className="text-2xl font-bold">Định giá phòng</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Ước tính khoảng giá thuê theo vị trí, diện tích và tiện ích. Kết quả để tham khảo, bạn tự quyết định giá đăng tin.</p></header>
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]"><form onSubmit={submit} onChange={() => { setResult(null); setError(''); }} aria-busy={busy} className="min-w-0 space-y-5"><fieldset disabled={busy} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><Input name="city" label="Tỉnh / thành phố" required maxLength={100} placeholder="TP Hồ Chí Minh" /><Input name="district" label="Quận / huyện" required maxLength={100} placeholder="Quận 7" /><Input name="ward" label="Phường / xã (không bắt buộc)" maxLength={100} /><Input name="area_sqm" label="Diện tích (m²)" type="number" required min="5.01" step="0.01" /><Input name="floor" label="Tầng (không bắt buộc)" type="number" min="0" step="1" /><label className="block text-sm font-semibold">Loại phòng<select name="room_type" className="mt-2 w-full rounded-xl border border-line bg-white p-3 text-sm"><option value="PHONG_TRO">Phòng trọ</option><option value="CHUNG_CU_MINI">Chung cư mini</option><option value="CAN_HO_DICH_VU">Căn hộ dịch vụ</option><option value="NHA_NGUYEN_CAN">Nhà nguyên căn</option><option value="O_GHEP">Ở ghép</option></select></label></div><fieldset><legend className="mb-3 text-sm font-semibold">Tiện ích</legend><div className="grid gap-3 sm:grid-cols-2">{AMENITIES.map((name) => <label key={name} className="flex items-center gap-2 text-sm"><input name="amenities" type="checkbox" value={name} className="accent-primary" />{name}</label>)}</div></fieldset><fieldset><legend className="mb-3 text-sm font-semibold">Đặc điểm phòng</legend><div className="grid gap-3 sm:grid-cols-2">{FEATURES.map(([name, label]) => <label key={name} className="flex items-center gap-2 text-sm"><input name={name} type="checkbox" defaultChecked={name === 'has_parking'} className="accent-primary" />{label}</label>)}</div></fieldset></fieldset>{error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}<Button type="submit" disabled={busy}>{busy ? 'Đang phân tích…' : 'Ước tính giá thuê'}</Button></form>
      <aside aria-live="polite" className="min-w-0 rounded-xl border border-line p-5 sm:p-6">{busy ? <p role="status" className="text-sm text-muted">Đang phân tích thông tin phòng…</p> : result ? <><h2 className="text-sm font-semibold text-muted">Giá thuê đề xuất / tháng</h2><p className="mt-2 break-words text-3xl font-bold text-primary">{formatVND(result.recommended_price)}</p><p className="mt-3 text-sm leading-6">Khoảng tham khảo: <strong>{formatVND(result.estimated_price_min)} – {formatVND(result.estimated_price_max)}</strong></p><p className="mt-2 text-xs text-muted">Độ tin cậy do dịch vụ trả về: {Math.round(result.confidence_score * 100)}%</p><dl className="mt-5 space-y-3 border-t border-line pt-5 text-sm">{[['Theo diện tích', result.breakdown.area_cost], ['Tiện ích', result.breakdown.amenities_surcharge], ['Đặc điểm bổ sung', result.breakdown.feature_bonus]].map(([label, value]) => <div key={String(label)} className="flex justify-between gap-3"><dt>{String(label)}</dt><dd className="font-semibold">{formatVND(Number(value))}</dd></div>)}</dl><h3 className="mt-6 font-semibold">Phân tích</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted">{pricingAnalysisText(result.market_analysis)}</p></> : <><h2 className="font-semibold">Khoảng giá phù hợp cho phòng của bạn</h2><p className="mt-2 text-sm leading-6 text-muted">Nhập thông tin bên cạnh để xem ước tính và các yếu tố ảnh hưởng đến giá thuê.</p></>}</aside>
    </div></section>;
}
