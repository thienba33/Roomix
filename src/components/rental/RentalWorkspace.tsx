'use client';

import { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRental } from '@/hooks/useRental';
import { useRoomDetails } from '@/hooks/useRoomDetails';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { ListingPhoto } from '@/components/rooms/ListingVisuals';
import ContactCard from './ContactCard';
import { formatVND } from '@/lib/utils';
import {
  acceptRental, cancelRental, cancelTenancy, confirmDeposit,
  completeSettlement, getSettlement, previewSettlement, rejectRental,
  todayVN, type ContractTerms, type TenancySettlement
} from '@/services/backend/rental';

const requestLabels: Record<string, string> = { PENDING: 'Chờ chủ trọ phản hồi', ACCEPTED: 'Đã chấp nhận', REJECTED: 'Đã từ chối', CANCELLED: 'Đã hủy' };
const contractLabels: Record<string, string> = { PENDING: 'Chờ xác nhận cọc', ACTIVE: 'Đang thuê', CANCELLED: 'Đã hủy', ENDED: 'Đã kết thúc' };
function Status({ value, contract = false }: { value: string; contract?: boolean }) {
  const tone = value === 'PENDING' ? 'amber' : value === 'ACCEPTED' || value === 'ACTIVE' ? 'green' : value === 'REJECTED' || value === 'CANCELLED' ? 'red' : 'gray';
  return <Badge tone={tone} dot>{contract ? contractLabels[value] : requestLabels[value]}</Badge>;
}
const moneyFields = [
  ['monthlyRent', 'Tiền thuê / tháng (đ)'], ['depositAmount', 'Tiền cọc (đ)'],
  ['electricityUnitPrice', 'Đơn giá điện (đ/kWh)'], ['waterUnitPrice', 'Đơn giá nước (đ/m³)'],
  ['initialElectricity', 'Chỉ số điện ban đầu'], ['initialWater', 'Chỉ số nước ban đầu'],
] as const;

type Action = { kind: 'accept' | 'reject' | 'cancel-request' | 'cancel-contract' | 'deposit' | 'end-tenancy' | 'view-settlement'; id: string };
const actionTitles: Record<Action['kind'], string> = {
  accept: 'Chấp nhận và tạo hợp đồng',
  reject: 'Từ chối yêu cầu',
  'cancel-request': 'Hủy yêu cầu quan tâm',
  'cancel-contract': 'Hủy hợp đồng chờ cọc',
  deposit: 'Xác nhận đã nhận cọc',
  'end-tenancy': 'Trả phòng & Quyết toán cọc (UC05.4)',
  'view-settlement': 'Bảng quyết toán hợp đồng & cọc',
};
const dateTime = (s: string) => new Date(s).toLocaleString('vi-VN', { timeZone: 'Asia/Bangkok' });

export default function RentalWorkspace({ mode }: { mode: 'tenant' | 'tenant-contracts' | 'requests' | 'contracts' }) {
  const { user, ready: authReady, openAuth } = useAuth();
  const rental = useRental();
  const catalog = useRoomDetails([...rental.requests.map((item) => item.roomId), ...rental.tenancies.map((item) => item.roomId)]);
  const [filter, setFilter] = useState('');
  const [action, setAction] = useState<Action | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [settlementData, setSettlementData] = useState<TenancySettlement | null>(null);
  const [calculatingPreview, setCalculatingPreview] = useState(false);
  const submitting = useRef(false);
  const tenantView = mode === 'tenant' || mode === 'tenant-contracts';
  const contracts = mode === 'contracts' || mode === 'tenant-contracts';
  const title = tenantView ? (contracts ? 'Hợp đồng của tôi' : 'Yêu cầu của tôi') : (contracts ? 'Hợp đồng thuê' : 'Yêu cầu thuê phòng');
  const room = (id: string) => catalog.items.find((r) => r.roomId === id);

  const open = async (kind: Action['kind'], id: string) => {
    submitting.current = false;
    setError('');
    setNotice('');
    setSettlementData(null);
    setAction({ kind, id });

    if (kind === 'view-settlement') {
      try {
        const data = await getSettlement(id);
        setSettlementData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Chưa có thông tin quyết toán cho hợp đồng này.');
      }
    }
  };

  const selected = rental.requests.find((r) => r.id === action?.id);
  const selectedTenancy = rental.tenancies.find((t) => t.id === action?.id);
  const detail = selected && room(selected.roomId);
  const start = detail && detail.availableFrom > todayVN() ? detail.availableFrom : todayVN();
  const end = new Date(Date.parse(start) + 365 * 86400000).toISOString().slice(0, 10);

  const handlePreviewSettlement = async (form: HTMLFormElement) => {
    if (!action || action.kind !== 'end-tenancy') return;
    const data = new FormData(form);
    setError('');
    setCalculatingPreview(true);
    try {
      const preview = await previewSettlement(action.id, {
        actualReturnDate: String(data.get('actualReturnDate')),
        finalElectricity: Number(data.get('finalElectricity')),
        finalWater: Number(data.get('finalWater')),
        damageCharge: Number(data.get('damageCharge') || 0),
        damageReason: String(data.get('damageReason') || ''),
      });
      setSettlementData(preview);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể tính toán quyết toán.');
    } finally {
      setCalculatingPreview(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!action || submitting.current) return;
    submitting.current = true;
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
        await acceptRental(action.id, terms);
        setNotice('Đã chấp nhận yêu cầu và tạo hợp đồng chờ cọc.');
      } else if (action.kind === 'reject') {
        await rejectRental(action.id, String(data.get('reason')));
        setNotice('Đã từ chối yêu cầu và lưu lý do.');
      } else if (action.kind === 'cancel-request') {
        await cancelRental(action.id);
        setNotice('Đã hủy yêu cầu thuê phòng.');
      } else if (action.kind === 'cancel-contract') {
        await cancelTenancy(action.id, String(data.get('reason')));
        setNotice('Đã hủy hợp đồng.');
      } else if (action.kind === 'deposit') {
        await confirmDeposit(action.id);
        setNotice('Đã xác nhận nhận cọc. Hợp đồng chuyển sang đang thuê.');
      } else if (action.kind === 'end-tenancy') {
        const previewReq = {
          actualReturnDate: String(data.get('actualReturnDate')),
          finalElectricity: Number(data.get('finalElectricity')),
          finalWater: Number(data.get('finalWater')),
          damageCharge: Number(data.get('damageCharge') || 0),
          damageReason: String(data.get('damageReason') || ''),
        };
        const expectedTotalDue = settlementData?.totalDue ?? 0;
        const collectedAmount = Number(data.get('collectedAmount') || 0);
        const refundedAmount = Number(data.get('refundedAmount') || 0);
        const paymentMethod = String(data.get('paymentMethod')) as 'CASH' | 'BANK_TRANSFER';

        await completeSettlement(action.id, {
          details: previewReq,
          expectedTotalDue,
          collectedAmount,
          refundedAmount,
          paymentMethod,
        });
        setNotice('Đã hoàn tất trả phòng và quyết toán cọc. Trạng thái phòng đã chuyển về Trống (AVAILABLE).');
      }
      setAction(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể thực hiện thao tác.');
    } finally {
      submitting.current = false;
    }
  };

  if (!authReady || !rental.ready || !catalog.ready) return <div role="status" className="space-y-4 py-8"><h1 className="text-2xl font-bold">{title}</h1><p className="text-muted">Đang tải thông tin thuê phòng…</p><div className="h-40 animate-pulse rounded-2xl bg-page" aria-hidden="true" /></div>;
  if (!user) return <div className="space-y-4 py-10"><h1 className="text-2xl font-bold">{title}</h1><p>Đăng nhập để xem {contracts ? 'hợp đồng' : 'yêu cầu thuê phòng'} của bạn.</p><Button onClick={() => openAuth('login', tenantView ? 'tenant' : 'landlord')}>Đăng nhập</Button></div>;
  if (user.role !== (tenantView ? 'TENANT' : 'LANDLORD')) return <p role="alert" className="py-10">Tài khoản hiện tại không có quyền xem mục này.</p>;
  if (rental.error || catalog.error) return <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6"><h1 className="font-bold">Chưa thể tải dữ liệu thuê phòng</h1><p className="mt-2 text-sm">{rental.error || catalog.error}</p><p className="mt-2 text-sm">Kiểm tra kết nối rồi tải lại trang.</p></div>;

  const requests = rental.requests.filter((r) => !filter || r.status === filter);
  const tenancies = rental.tenancies.filter((t) => !filter || t.status === filter);
  const visibleCount = contracts ? tenancies.length : requests.length;
  const subtitle = contracts ? tenantView ? 'Theo dõi điều khoản, hạn cọc và tình trạng thuê của bạn.' : 'Theo dõi hợp đồng chờ cọc, đang thuê và hoàn tất thủ tục trả phòng, quyết toán cọc.' : tenantView ? 'Xem phản hồi của chủ trọ cho những phòng bạn quan tâm.' : 'Xem yêu cầu mới và chọn khách thuê phù hợp cho từng phòng.';

  return <div className="space-y-6 pb-8">
    <header className="border-b border-line pb-6"><h1 className="text-[28px] font-extrabold tracking-tight text-ink sm:text-[32px]">{title}</h1><p className="mt-2 text-sm leading-6 text-muted">{subtitle}</p></header>
    <div className="flex flex-wrap items-center justify-between gap-3"><p role="status" className="text-sm text-muted">{visibleCount} {contracts ? 'hợp đồng' : 'yêu cầu'}{filter ? ' phù hợp' : ''}</p><label className="flex items-center gap-2 text-sm font-semibold">Trạng thái<select aria-label="Lọc theo trạng thái" className="min-h-10 rounded-xl border border-line bg-white px-3 py-2 font-normal focus-visible:outline-2 focus-visible:outline-primary" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="">Tất cả</option>{(contracts ? ['PENDING', 'ACTIVE', 'CANCELLED', 'ENDED'] : ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED']).map((s) => <option key={s} value={s}>{contracts ? contractLabels[s] : requestLabels[s]}</option>)}</select></label></div>
    {notice && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
    {visibleCount === 0 && <div className="rounded-2xl border border-line bg-white px-6 py-12 text-center"><h2 className="text-lg font-bold">{filter ? 'Không có mục ở trạng thái này' : contracts ? 'Chưa có hợp đồng' : 'Chưa có yêu cầu quan tâm'}</h2><p className="mt-2 text-sm text-muted">{filter ? 'Chọn trạng thái khác để xem danh sách.' : tenantView ? 'Khám phá phòng phù hợp để bắt đầu.' : 'Khi khách gửi yêu cầu, thông tin sẽ xuất hiện tại đây.'}</p>{filter ? <Button variant="outline" className="mt-5" onClick={() => setFilter('')}>Xóa bộ lọc</Button> : tenantView ? <Link href="/" className="mt-5 inline-block text-sm font-semibold text-primary">Tìm phòng</Link> : null}</div>}

    {!contracts && requests.slice().reverse().map((r) => <article key={r.id} className="rounded-2xl border border-line bg-white p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-[112px_minmax(0,1fr)]"><ListingPhoto src={room(r.roomId)?.primaryImageUrl} alt={`Ảnh ${room(r.roomId)?.title || 'phòng thuê'}`} className="h-28 rounded-xl sm:h-24" /><div className="min-w-0"><div className="flex flex-wrap items-start justify-between gap-2"><div><Link className="text-base font-bold text-ink hover:text-primary" href={`/rooms/${r.roomId}`}>{room(r.roomId)?.title || `Phòng ${r.roomId}`}</Link><p className="mt-1 text-xs text-muted">Gửi {dateTime(r.createdAt)} · Mã yêu cầu {r.id.slice(0, 8)}</p></div><Status value={r.status} /></div>{room(r.roomId) && <p className="mt-2 text-sm text-muted">{room(r.roomId)?.houseName} · {room(r.roomId)?.floorName} · Phòng {room(r.roomId)?.roomNumber}</p>}</div></div>
      <div className="mt-4 border-t border-line pt-4">{!tenantView && <p className="mb-3 text-xs text-muted">Mã khách thuê: <span className="font-semibold text-secondary">{r.tenantId.slice(0, 8)}…{r.tenantId.slice(-4)}</span></p>}<p className="text-xs font-semibold text-muted">Lời nhắn</p><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{r.note || 'Không có lời nhắn.'}</p>
      {r.rejectReason && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">Lý do từ chối: {r.rejectReason}</p>}
      {r.status === 'ACCEPTED' && <p className="mt-3 text-sm text-secondary">Yêu cầu đã được chấp nhận. Hợp đồng đang chờ xác nhận cọc. <Link href={tenantView ? '/contracts' : '/landlord/tenants'} className="font-semibold text-primary hover:underline">Xem hợp đồng</Link></p>}
      {r.status === 'ACCEPTED' && tenantView && <ContactCard key={r.id} request={r} />}
      {r.status === 'ACCEPTED' && !tenantView && r.contactRequestedAt && <p role="status" className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">Khách đã yêu cầu bổ sung số điện thoại để xem danh thiếp. Hồ sơ chủ trọ hiện chưa có thông tin liên hệ đầy đủ.</p>}
      {r.status === 'PENDING' && <div className="mt-4 flex flex-wrap gap-2">{tenantView ? <Button size="sm" variant="outline" onClick={() => open('cancel-request', r.id)}>Hủy yêu cầu</Button> : <><Button size="sm" onClick={() => open('accept', r.id)}>Chấp nhận</Button><Button size="sm" variant="outline" onClick={() => open('reject', r.id)}>Từ chối</Button></>}</div>}</div>
    </article>)}

    {contracts && tenancies.slice().reverse().map((t) => <article key={t.id} className="rounded-2xl border border-line bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold">{room(t.roomId)?.title || `Phòng ${t.roomId}`}</h2><p className="mt-1 break-all text-xs text-muted">Hợp đồng {t.contractCode}</p></div><Status value={t.status} contract /></div>
      {t.status === 'PENDING' && <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">Hợp đồng đã tạo, chưa có hiệu lực thuê. Chủ trọ cần xác nhận đã nhận cọc trước {dateTime(t.depositDeadline)}.</p>}
      <dl className="mt-5 grid gap-4 border-t border-line pt-5 text-sm sm:grid-cols-2"><div><dt className="text-muted">Thời hạn thuê</dt><dd className="mt-1 font-semibold">{t.startDate.split('-').reverse().join('/')} – {t.endDate.split('-').reverse().join('/')}</dd></div><div><dt className="text-muted">Tiền thuê mỗi tháng</dt><dd className="mt-1 font-semibold">{formatVND(t.monthlyRent)}</dd></div><div><dt className="text-muted">Tiền cọc</dt><dd className="mt-1 font-semibold">{formatVND(t.depositAmount)}</dd></div><div><dt className="text-muted">Hạn xác nhận cọc</dt><dd className="mt-1 font-semibold">{dateTime(t.depositDeadline)}</dd></div></dl>
      <details className="mt-5 border-t border-line pt-4 text-sm"><summary className="cursor-pointer font-semibold text-primary">Xem chỉ số và điều khoản</summary><div className="mt-3 space-y-2 leading-6 text-secondary"><p>Điện: {formatVND(t.electricityUnitPrice)}/kWh · Chỉ số ban đầu: {t.initialElectricity}</p><p>Nước: {formatVND(t.waterUnitPrice)}/m³ · Chỉ số ban đầu: {t.initialWater}</p><p className="whitespace-pre-wrap break-words">{t.termsAndConditions || 'Không có điều khoản bổ sung.'}</p>{t.depositConfirmedAt && <p>Đã xác nhận cọc: {dateTime(t.depositConfirmedAt)}</p>}</div></details>
      {t.cancellationReason && <p className="mt-4 text-sm text-red-700">Lý do hủy: {t.cancellationReason}</p>}
      <div className="mt-5 flex flex-wrap gap-2">
        {t.status === 'PENDING' && (
          <>
            {!tenantView && <Button size="sm" onClick={() => open('deposit', t.id)}>Xác nhận đã nhận cọc</Button>}
            <Button size="sm" variant="outline" onClick={() => open('cancel-contract', t.id)}>Hủy hợp đồng</Button>
          </>
        )}
        {t.status === 'ACTIVE' && !tenantView && (
          <Button size="sm" variant="outline" onClick={() => open('end-tenancy', t.id)}>
            Trả phòng &amp; Quyết toán cọc (UC05.4)
          </Button>
        )}
        {t.status === 'ENDED' && (
          <Button size="sm" variant="outline" onClick={() => open('view-settlement', t.id)}>
            Xem bảng quyết toán cọc
          </Button>
        )}
      </div>
    </article>)}

    {/* Action Modal */}
    <Modal open={action !== null} onClose={() => setAction(null)} title={action ? actionTitles[action.kind] : undefined} widthClass="max-w-2xl">
      {action?.kind === 'view-settlement' ? (
        <div className="space-y-4">
          {error ? (
            <p role="alert" className="text-sm text-red-700">{error}</p>
          ) : !settlementData ? (
            <p className="text-sm text-muted">Đang tải bảng quyết toán…</p>
          ) : (
            <div className="space-y-4 text-sm">
              <div className="rounded-xl bg-page p-4 grid gap-2">
                <div className="flex justify-between"><span className="text-muted">Ngày trả phòng:</span><span className="font-semibold">{settlementData.actualReturnDate}</span></div>
                <div className="flex justify-between"><span className="text-muted">Chỉ số điện:</span><span>{settlementData.previousElectricity} → {settlementData.finalElectricity} (Tiền: {formatVND(settlementData.additionalElectricity)})</span></div>
                <div className="flex justify-between"><span className="text-muted">Chỉ số nước:</span><span>{settlementData.previousWater} → {settlementData.finalWater} (Tiền: {formatVND(settlementData.additionalWater)})</span></div>
                <div className="flex justify-between"><span className="text-muted">Nợ hóa đơn cũ:</span><span className="font-semibold text-red-600">{formatVND(settlementData.invoiceDebt)}</span></div>
                <div className="flex justify-between"><span className="text-muted">Khấu trừ hư hỏng:</span><span className="font-semibold text-red-600">{formatVND(settlementData.damageCharge)} {settlementData.damageReason ? `(${settlementData.damageReason})` : ''}</span></div>
                <div className="border-t border-line pt-2 flex justify-between font-bold"><span>Tổng các khoản phải thu:</span><span className="text-ink">{formatVND(settlementData.totalDue)}</span></div>
                <div className="flex justify-between"><span className="text-muted">Tiền cọc ban đầu:</span><span className="font-semibold">{formatVND(settlementData.depositAmount)}</span></div>
                <div className="flex justify-between"><span className="text-muted">Cọc đã cấn trừ:</span><span className="font-semibold">{formatVND(settlementData.depositApplied)}</span></div>
                <div className="border-t border-line pt-2 flex justify-between font-bold text-base">
                  <span>Kết quả quyết toán:</span>
                  {settlementData.refundedAmount > 0 ? (
                    <span className="text-green-700">Chủ trọ hoàn cọc cho khách: {formatVND(settlementData.refundedAmount)}</span>
                  ) : settlementData.collectedAmount > 0 ? (
                    <span className="text-red-700">Khách thuê cần nộp thêm: {formatVND(settlementData.collectedAmount)}</span>
                  ) : (
                    <span className="text-secondary">Đã cấn trừ đủ bằng tiền cọc</span>
                  )}
                </div>
                <div className="text-xs text-muted mt-2">Phương thức thanh toán: {settlementData.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}</div>
              </div>
            </div>
          )}
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setAction(null)}>Đóng</Button>
          </div>
        </div>
      ) : (
        <form key={action?.id + ':' + action?.kind} onSubmit={submit} className="space-y-5">
          {action?.kind === 'accept' ? <>
            <p className="text-sm leading-6 text-muted">{detail?.title || `Phòng ${selected?.roomId ?? ''}`}. Khi chấp nhận, một hợp đồng <strong>chờ xác nhận cọc</strong> được tạo. Các yêu cầu đang chờ khác cho phòng này sẽ bị từ chối.</p>
            <fieldset className="space-y-3"><legend className="text-sm font-bold">Thời hạn thuê</legend><div className="grid gap-3 sm:grid-cols-2"><Input name="startDate" label="Ngày bắt đầu" type="date" required min={start} defaultValue={start} /><Input name="endDate" label="Ngày kết thúc" type="date" required min={start} defaultValue={end} /></div></fieldset>
            <fieldset className="space-y-3"><legend className="text-sm font-bold">Tiền thuê và chỉ số ban đầu</legend><div className="grid gap-3 sm:grid-cols-2">{moneyFields.map(([key, label]) => <Input key={key} name={key} label={label} type="number" required min={key === 'monthlyRent' ? '0.01' : '0'} max="9999999999999.99" step="0.01" defaultValue={key === 'monthlyRent' ? detail?.rentalPrice : key === 'depositAmount' ? detail?.depositAmount : 0} />)}</div></fieldset>
            <Input name="depositDeadline" label="Hạn xác nhận cọc (để trống: 24 giờ)" type="datetime-local" />
            <label className="block text-sm font-semibold">Điều khoản bổ sung<textarea name="termsAndConditions" maxLength={5000} rows={3} className="mt-2 w-full rounded-xl border border-line p-3 text-sm focus-visible:outline-2 focus-visible:outline-primary" /></label>
          </> : action?.kind === 'end-tenancy' ? <>
            <p className="text-sm leading-6 text-muted">
              Quy trình trả phòng và quyết toán hợp đồng (UC05.4). Nhập chỉ số điện nước cuối kỳ và chi phí phát sinh nếu có để tính toán hoàn/thu cọc. Sau khi hoàn tất, phòng sẽ được đưa về trạng thái <strong>Trống (AVAILABLE)</strong>.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input name="actualReturnDate" label="Ngày trả phòng thực tế" type="date" required defaultValue={todayVN()} />
              <Input name="finalElectricity" label="Chỉ số điện chốt cuối" type="number" step="0.01" required min={selectedTenancy?.initialElectricity ?? 0} defaultValue={selectedTenancy?.initialElectricity ?? 0} />
              <Input name="finalWater" label="Chỉ số nước chốt cuối" type="number" step="0.01" required min={selectedTenancy?.initialWater ?? 0} defaultValue={selectedTenancy?.initialWater ?? 0} />
              <Input name="damageCharge" label="Khấu trừ hư hỏng / đền bù (đ)" type="number" min="0" step="1000" defaultValue="0" />
            </div>
            <Input name="damageReason" label="Lý do khấu trừ hư hỏng (nếu có)" placeholder="Ví dụ: Hư hỏng bóng đèn, mất chìa khóa..." />

            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={calculatingPreview}
                onClick={(e) => {
                  const form = (e.currentTarget as HTMLElement).closest('form');
                  if (form) void handlePreviewSettlement(form);
                }}
              >
                {calculatingPreview ? 'Đang tính toán…' : '📊 Xem trước bảng tính quyết toán'}
              </Button>
            </div>

            {settlementData && (
              <div className="rounded-xl border border-line bg-page p-4 text-xs space-y-1.5">
                <p className="font-bold text-ink text-sm">Bảng tính toán sơ bộ:</p>
                <div className="flex justify-between"><span>Điện phát sinh:</span><span>{formatVND(settlementData.additionalElectricity)}</span></div>
                <div className="flex justify-between"><span>Nước phát sinh:</span><span>{formatVND(settlementData.additionalWater)}</span></div>
                <div className="flex justify-between"><span>Nợ hóa đơn cũ:</span><span className="text-red-600">{formatVND(settlementData.invoiceDebt)}</span></div>
                <div className="flex justify-between"><span>Đền bù đồ đạc:</span><span>{formatVND(settlementData.damageCharge)}</span></div>
                <div className="flex justify-between font-bold border-t border-line/50 pt-1"><span>Tổng chi phí cần thu:</span><span>{formatVND(settlementData.totalDue)}</span></div>
                <div className="flex justify-between font-bold border-t border-line/50 pt-1 text-primary">
                  <span>Tiền cọc {formatVND(settlementData.depositAmount)}:</span>
                  <span>{settlementData.amountToRefund > 0 ? `Hoàn trả khách: ${formatVND(settlementData.amountToRefund)}` : `Khách cần bù thêm: ${formatVND(settlementData.amountToCollect)}`}</span>
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-line">
              <Input name="refundedAmount" label="Số tiền hoàn cọc thực tế (đ)" type="number" min="0" step="1" defaultValue={settlementData?.amountToRefund ?? 0} />
              <Input name="collectedAmount" label="Số tiền thu thêm thực tế (đ)" type="number" min="0" step="1" defaultValue={settlementData?.amountToCollect ?? 0} />
            </div>

            <label className="block text-sm font-semibold">Phương thức thanh toán cọc chênh lệch
              <select name="paymentMethod" className="mt-1.5 w-full rounded-xl border border-line bg-white p-3 text-sm">
                <option value="CASH">Tiền mặt</option>
                <option value="BANK_TRANSFER">Chuyển khoản</option>
              </select>
            </label>
          </> : action?.kind === 'reject' || action?.kind === 'cancel-contract' ? <label className="block text-sm font-semibold">Lý do <span className="text-red-600">*</span><textarea name="reason" required maxLength={2000} rows={3} className="mt-2 w-full rounded-xl border border-line p-3 text-sm focus-visible:outline-2 focus-visible:outline-primary" placeholder="Nêu rõ lý do…" /></label> : <p className="text-sm leading-6 text-muted">{action?.kind === 'deposit' ? 'Chỉ xác nhận khi bạn đã nhận tiền cọc. Hợp đồng sẽ chuyển sang đang thuê và phòng không còn nhận yêu cầu mới.' : 'Yêu cầu đang chờ sẽ được hủy. Bạn có thể gửi lại theo điều kiện phòng hiện tại.'}</p>}
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setAction(null)}>Đóng</Button>
            <Button type="submit" variant={action?.kind === 'reject' || action?.kind === 'cancel-contract' ? 'danger' : 'primary'}>
              {action?.kind === 'accept' ? 'Chấp nhận và tạo hợp đồng' : action?.kind === 'reject' ? 'Từ chối yêu cầu' : action?.kind === 'deposit' ? 'Đã nhận cọc' : action?.kind === 'end-tenancy' ? 'Hoàn tất trả phòng & Quyết toán' : 'Xác nhận hủy'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  </div>;
}
