'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRental } from '@/hooks/useRental';
import { useCatalog } from '@/hooks/useCatalog';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { formatVND } from '@/lib/utils';
import { acceptRental, cancelRental, cancelTenancy, confirmDeposit, rejectRental, todayVN, type ContractTerms } from '@/services/mock/rental';

const labels: Record<string, string> = { PENDING: 'Chờ xử lý', ACCEPTED: 'Đã chấp nhận', REJECTED: 'Đã từ chối', CANCELLED: 'Đã hủy', ACTIVE: 'Đang thuê', ENDED: 'Đã kết thúc' };
const moneyFields = [
  ['monthlyRent', 'Tiền thuê / tháng (đ)'], ['depositAmount', 'Tiền cọc (đ)'],
  ['electricityUnitPrice', 'Đơn giá điện (đ/kWh)'], ['waterUnitPrice', 'Đơn giá nước (đ/m³)'],
  ['initialElectricity', 'Chỉ số điện ban đầu'], ['initialWater', 'Chỉ số nước ban đầu'],
] as const;
type Action = { kind: 'accept' | 'reject' | 'cancel-request' | 'cancel-contract' | 'deposit'; id: string };
const actionTitles = { accept: 'Chấp nhận và tạo hợp đồng', reject: 'Từ chối yêu cầu', 'cancel-request': 'Hủy yêu cầu thuê', 'cancel-contract': 'Hủy hợp đồng chờ cọc', deposit: 'Xác nhận đã nhận cọc' };
const dateTime = (s: string) => new Date(s).toLocaleString('vi-VN', { timeZone: 'Asia/Bangkok' });

export default function RentalWorkspace({ mode }: { mode: 'tenant' | 'tenant-contracts' | 'requests' | 'contracts' }) {
  const { user, openAuth } = useAuth();
  const rental = useRental();
  const catalog = useCatalog();
  const [filter, setFilter] = useState('');
  const [action, setAction] = useState<Action | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const tenantView = mode === 'tenant' || mode === 'tenant-contracts';
  const contracts = mode === 'contracts' || mode === 'tenant-contracts';
  const title = tenantView ? (contracts ? 'Hợp đồng của tôi' : 'Yêu cầu của tôi') : (contracts ? 'Hợp đồng thuê' : 'Yêu cầu thuê phòng');
  const room = (id: string) => catalog.items.find((r) => r.detail.roomId === id)?.detail;
  const open = (kind: Action['kind'], id: string) => { setError(''); setNotice(''); setAction({ kind, id }); };
  const selected = rental.requests.find((r) => r.id === action?.id);
  const detail = selected && room(selected.roomId);
  const start = detail && detail.availableFrom > todayVN() ? detail.availableFrom : todayVN();
  const end = new Date(Date.parse(start) + 365 * 86400000).toISOString().slice(0, 10);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!action) return;
    const data = new FormData(event.currentTarget);
    try {
      if (action.kind === 'accept') {
        const terms: ContractTerms = {
          startDate: String(data.get('startDate')), endDate: String(data.get('endDate')),
          monthlyRent: Number(data.get('monthlyRent')), depositAmount: Number(data.get('depositAmount')),
          electricityUnitPrice: Number(data.get('electricityUnitPrice')), waterUnitPrice: Number(data.get('waterUnitPrice')),
          initialElectricity: Number(data.get('initialElectricity')), initialWater: Number(data.get('initialWater')),
          termsAndConditions: String(data.get('termsAndConditions') || ''),
          depositDeadline: data.get('depositDeadline') ? new Date(String(data.get('depositDeadline'))).toISOString() : undefined,
        };
        acceptRental(action.id, terms);
      } else if (action.kind === 'reject') rejectRental(action.id, String(data.get('reason')));
      else if (action.kind === 'cancel-request') cancelRental(action.id);
      else if (action.kind === 'cancel-contract') cancelTenancy(action.id, String(data.get('reason')));
      else confirmDeposit(action.id);
      setNotice(action.kind === 'accept' ? 'Đã tạo hợp đồng chờ cọc. Các yêu cầu khác cho phòng này đã được từ chối.' : 'Đã cập nhật thành công.');
      setAction(null);
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể thực hiện thao tác.'); }
  };
  if (!rental.ready) return <p className="py-10 text-muted">Đang tải yêu cầu thuê…</p>;
  if (!user) return <div className="space-y-4 py-10"><h1 className="text-2xl font-bold">{title}</h1><p>Đăng nhập để xem {contracts ? 'hợp đồng' : 'yêu cầu thuê phòng'} của bạn.</p><Button onClick={() => openAuth('login', tenantView ? 'tenant' : 'landlord')}>Đăng nhập</Button></div>;
  if (user.role !== (tenantView ? 'TENANT' : 'LANDLORD')) return <p className="py-10">Tài khoản hiện tại không có quyền xem mục này.</p>;
  const requests = rental.requests.filter((r) => !filter || r.status === filter);
  const tenancies = rental.tenancies.filter((t) => !filter || t.status === filter);
  return <div className="space-y-5">
    <h1 className="text-2xl font-bold">{title}</h1>
    <label className="flex items-center gap-3 text-sm">Trạng thái<select className="rounded-xl border border-line bg-white p-2" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="">Tất cả</option>{(contracts ? ['PENDING', 'ACTIVE', 'CANCELLED', 'ENDED'] : ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED']).map((s) => <option key={s} value={s}>{contracts && s === 'PENDING' ? 'Chờ cọc' : labels[s]}</option>)}</select></label>
    {notice && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
    {(rental.error || catalog.error) && <p role="alert" className="text-red-600">{rental.error || catalog.error}</p>}
    {(contracts ? tenancies : requests).length === 0 && <p className="rounded-2xl border border-line bg-white p-8 text-muted">Chưa có {contracts ? 'hợp đồng' : 'yêu cầu'} phù hợp.</p>}
    {!contracts && requests.slice().reverse().map((r) => <article key={r.id} className="space-y-3 rounded-2xl border border-line bg-white p-5">
      <div className="flex flex-wrap justify-between gap-2"><Link className="font-bold hover:text-primary" href={`/rooms/${r.roomId}`}>{room(r.roomId)?.title || 'Phòng thuê'}</Link><span className="text-sm text-primary">{labels[r.status]}</span></div>
      <p className="text-xs text-muted">Yêu cầu {r.id.slice(0, 8)} · {dateTime(r.createdAt)}</p>
      <p className="whitespace-pre-wrap break-words text-sm">{r.note || 'Không có lời nhắn.'}</p>
      {r.rejectReason && <p className="text-sm text-red-600">Lý do: {r.rejectReason}</p>}
      {r.status === 'ACCEPTED' && <p className="text-sm text-muted">Hợp đồng đã được tạo. <Link href={tenantView ? '/contracts' : '/landlord/tenants'} className="font-semibold text-primary hover:underline">Xem hợp đồng</Link>.</p>}
      {r.status === 'PENDING' && <div className="flex flex-wrap gap-2">{tenantView ? <Button variant="outline" onClick={() => open('cancel-request', r.id)}>Hủy yêu cầu</Button> : <><Button onClick={() => open('accept', r.id)}>Chấp nhận</Button><Button variant="outline" onClick={() => open('reject', r.id)}>Từ chối</Button></>}</div>}
    </article>)}
    {contracts && tenancies.slice().reverse().map((t) => <article key={t.id} className="space-y-3 rounded-2xl border border-line bg-white p-5">
      <div className="flex flex-wrap justify-between gap-2"><h2 className="font-bold">{room(t.roomId)?.title || 'Phòng thuê'}</h2><span className="text-sm text-primary">{t.status === 'PENDING' ? 'Chờ cọc' : labels[t.status]}</span></div>
      <p className="break-all text-xs text-muted">{t.contractCode}</p>
      <div className="grid gap-2 text-sm sm:grid-cols-2"><p>Thời hạn: {t.startDate} → {t.endDate}</p><p>Tiền thuê: {formatVND(t.monthlyRent)} / tháng</p><p>Tiền cọc: {formatVND(t.depositAmount)}</p><p>Hạn cọc: {dateTime(t.depositDeadline)}</p></div>
      <details className="text-sm"><summary className="cursor-pointer font-semibold">Điều khoản và chỉ số</summary><div className="mt-3 space-y-2"><p>Điện: {formatVND(t.electricityUnitPrice)} / kWh · Chỉ số đầu: {t.initialElectricity}</p><p>Nước: {formatVND(t.waterUnitPrice)} / m³ · Chỉ số đầu: {t.initialWater}</p><p className="whitespace-pre-wrap break-words">{t.termsAndConditions || 'Không có điều khoản bổ sung.'}</p>{t.depositConfirmedAt && <p>Đã xác nhận cọc: {dateTime(t.depositConfirmedAt)}</p>}</div></details>
      {t.cancellationReason && <p className="text-sm text-red-600">Lý do hủy: {t.cancellationReason}</p>}
      {t.status === 'PENDING' && <div className="flex flex-wrap gap-2">{!tenantView && <Button onClick={() => open('deposit', t.id)}>Xác nhận đã nhận cọc</Button>}<Button variant="outline" onClick={() => open('cancel-contract', t.id)}>Hủy hợp đồng</Button></div>}
    </article>)}
    <Modal open={action !== null} onClose={() => setAction(null)} title={action ? actionTitles[action.kind] : undefined} widthClass="max-w-xl">
      <form key={action?.id + ':' + action?.kind} onSubmit={submit} className="space-y-4">
        {action?.kind === 'accept' ? <><p className="text-sm text-muted">{detail?.title}. Hợp đồng chỉ có hiệu lực sau khi chủ trọ xác nhận nhận cọc.</p><div className="grid gap-4 sm:grid-cols-2">
          <Input name="startDate" label="Ngày bắt đầu" type="date" required min={start} defaultValue={start} />
          <Input name="endDate" label="Ngày kết thúc" type="date" required min={start} defaultValue={end} />
          {moneyFields.map(([key, label]) => <Input key={key} name={key} label={label} type="number" required min={key === 'monthlyRent' ? '0.01' : '0'} max="9999999999999.99" step="0.01" defaultValue={key === 'monthlyRent' ? detail?.rentalPrice : key === 'depositAmount' ? detail?.depositAmount : 0} />)}
        </div><Input name="depositDeadline" label="Hạn đặt cọc (để trống: 24 giờ kể từ lúc chấp nhận)" type="datetime-local" /><label className="block text-sm">Điều khoản bổ sung<textarea name="termsAndConditions" maxLength={5000} rows={3} className="mt-2 w-full rounded-xl border border-line p-3" /></label></> : action?.kind === 'reject' || action?.kind === 'cancel-contract' ? <label className="block text-sm">Lý do<textarea name="reason" required maxLength={2000} rows={3} className="mt-2 w-full rounded-xl border border-line p-3" /></label> : <p className="text-sm">{action?.kind === 'deposit' ? 'Chỉ xác nhận khi bạn đã nhận đủ tiền cọc. Phòng sẽ chuyển sang đang thuê.' : 'Bạn muốn hủy yêu cầu thuê này?'}</p>}
        <p role="alert" className="min-h-5 text-sm text-red-600">{error}</p><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setAction(null)}>Đóng</Button><Button type="submit">Xác nhận</Button></div>
      </form>
    </Modal>
  </div>;
}
