'use client';

import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatVND } from '@/lib/utils';
import type { RentalRequest, Tenancy } from '@/services/backend/rental';
import type { RoomDetail } from '@/services/backend/rooms';
import { hostDate } from './presentation';

type HostAction = 'accept' | 'reject' | 'cancel-contract' | 'deposit' | 'end-tenancy' | 'view-settlement';
const requestLabels: Record<string, string> = { PENDING: 'Chờ xử lý', ACCEPTED: 'Đã chấp nhận', REJECTED: 'Đã từ chối', CANCELLED: 'Đã hủy' };
const contractLabels: Record<string, string> = { PENDING: 'Chờ xác nhận cọc', ACTIVE: 'Đang thuê', CANCELLED: 'Đã hủy', ENDED: 'Đã kết thúc' };
function Status({ value, contract = false }: { value: string; contract?: boolean }) {
  return <Badge tone={value === 'PENDING' ? 'amber' : ['ACCEPTED', 'ACTIVE'].includes(value) ? 'green' : ['REJECTED', 'CANCELLED'].includes(value) ? 'red' : 'gray'} dot>{(contract ? contractLabels : requestLabels)[value] ?? value}</Badge>;
}
export default function HostRentalList({ contracts, requests, tenancies, room, initialRecord, onAction }: {
  contracts: boolean;
  requests: RentalRequest[];
  tenancies: Tenancy[];
  room: (id: string) => RoomDetail | undefined;
  initialRecord: string;
  onAction: (kind: HostAction, id: string) => Promise<void>;
}) {
  return <div className="host-rental-records">
    {!contracts && [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((request) => <details key={request.id} className="host-rental-record" open={request.id === initialRecord || undefined}>
      <summary><span className="host-record-name"><strong>{room(request.roomId)?.title || `Phòng ${request.roomId}`}</strong><span>Gửi {hostDate(request.createdAt, true)}</span></span><Status value={request.status} /><span className="host-record-expand" aria-hidden="true">⌄</span></summary>
      <div className="host-record-body">
        <div><h2 className="text-sm font-semibold">Lời nhắn</h2><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{request.note || 'Không có lời nhắn.'}</p>
          {request.rejectReason && <p className="mt-4 bg-red-50 p-3 text-sm text-red-800">Lý do từ chối: {request.rejectReason}</p>}
          {request.status === 'ACCEPTED' && <p className="mt-4 text-sm leading-6 text-muted">Yêu cầu đã được chấp nhận. <Link href="/landlord/tenants" className="font-semibold text-primary">Xem hợp đồng</Link></p>}
          {request.status === 'ACCEPTED' && request.contactRequestedAt && <p role="status" className="mt-3 bg-amber-50 p-3 text-sm leading-6 text-amber-900">Khách đã yêu cầu bổ sung số điện thoại để xem danh thiếp. Hồ sơ chủ trọ hiện chưa có thông tin liên hệ đầy đủ.</p>}
        </div>
        <div><Link href={`/rooms/${request.roomId}`} className="text-sm font-semibold text-primary">Xem thông tin phòng</Link>{room(request.roomId) && <p className="mt-2 text-sm text-muted">{room(request.roomId)?.houseName} · {room(request.roomId)?.floorName} · Phòng {room(request.roomId)?.roomNumber}</p>}
          <details className="mt-4 text-xs text-muted"><summary className="cursor-pointer">Mã yêu cầu và khách thuê</summary><p className="mt-2 break-all">Yêu cầu: {request.id}</p><p className="mt-2 break-all">Khách thuê: {request.tenantId}</p></details>
          {request.status === 'PENDING' && <div className="mt-5 flex flex-wrap gap-2"><Button size="sm" onClick={() => void onAction('accept', request.id)}>Chấp nhận</Button><Button size="sm" variant="outline" onClick={() => void onAction('reject', request.id)}>Từ chối</Button></div>}
        </div>
      </div>
    </details>)}
    {contracts && [...tenancies].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((contract) => <details key={contract.id} className="host-rental-record" open={contract.id === initialRecord || undefined}>
      <summary><span className="host-record-name"><strong>{room(contract.roomId)?.title || `Phòng ${contract.roomId}`}</strong><span>{contract.contractCode} · {hostDate(contract.startDate)} – {hostDate(contract.endDate)}</span></span><span className="host-record-rent">{formatVND(contract.monthlyRent)}<span>/ tháng</span></span><Status value={contract.status} contract /><span className="host-record-expand" aria-hidden="true">⌄</span></summary>
      <div className="host-contract-body">
        {contract.status === 'PENDING' && <p className="bg-amber-50 p-3 text-sm leading-6 text-amber-900">Chưa có hiệu lực thuê. Xác nhận đã nhận cọc trước {hostDate(contract.depositDeadline, true)}.</p>}
        <dl className="host-contract-facts"><div><dt>Thời hạn thuê</dt><dd>{hostDate(contract.startDate)} – {hostDate(contract.endDate)}</dd></div><div><dt>Tiền thuê / tháng</dt><dd>{formatVND(contract.monthlyRent)}</dd></div><div><dt>Tiền cọc</dt><dd>{formatVND(contract.depositAmount)}</dd></div><div><dt>Hạn xác nhận cọc</dt><dd>{hostDate(contract.depositDeadline, true)}</dd></div></dl>
        <details className="border-t border-line py-4 text-sm"><summary className="cursor-pointer font-semibold text-primary">Chỉ số và điều khoản</summary><div className="mt-3 space-y-2 leading-6 text-secondary"><p>Điện: {formatVND(contract.electricityUnitPrice)}/kWh · Chỉ số ban đầu: {contract.initialElectricity}</p><p>Nước: {formatVND(contract.waterUnitPrice)}/m³ · Chỉ số ban đầu: {contract.initialWater}</p><p className="whitespace-pre-wrap break-words">{contract.termsAndConditions || 'Không có điều khoản bổ sung.'}</p>{contract.depositConfirmedAt && <p>Đã xác nhận cọc: {hostDate(contract.depositConfirmedAt, true)}</p>}</div></details>
        {contract.cancellationReason && <p className="mb-4 text-sm text-red-700">Lý do hủy: {contract.cancellationReason}</p>}
        <div className="flex flex-wrap justify-end gap-2">{contract.status === 'PENDING' && <><Button size="sm" onClick={() => void onAction('deposit', contract.id)}>Xác nhận đã nhận cọc</Button><Button size="sm" variant="outline" onClick={() => void onAction('cancel-contract', contract.id)}>Hủy hợp đồng</Button></>}{contract.status === 'ACTIVE' && <Button size="sm" variant="outline" onClick={() => void onAction('end-tenancy', contract.id)}>Trả phòng &amp; Quyết toán cọc</Button>}{contract.status === 'ENDED' && <Button size="sm" variant="outline" onClick={() => void onAction('view-settlement', contract.id)}>Xem bảng quyết toán cọc</Button>}</div>
      </div>
    </details>)}
  </div>;
}
