'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApiData } from '@/hooks/useApiData';
import { changePostStatus, CATALOG_EVENT, listLandlordRooms, type CatalogRoom } from '@/services/backend/rooms';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ROOM_STATUS_LABELS } from '@/components/landlord/presentation';
import { formatVND } from '@/lib/utils';

const EMPTY: CatalogRoom[] = [];
const POST_LABELS = { DRAFT: 'Nháp', PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Bị từ chối', HIDDEN: 'Đã ẩn' };
export default function LandlordListings({ initialHouse = '' }: { initialHouse?: string }) {
  const { data: items, ready, error, retry } = useApiData('landlord-rooms', listLandlordRooms, EMPTY, CATALOG_EVENT);
  const [filter, setFilter] = useState('ALL');
  const [postFilter, setPostFilter] = useState('ALL');
  const [houseId, setHouseId] = useState(initialHouse);
  const [search, setSearch] = useState('');
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const allRooms = items.map((item) => ({ ...item.detail, id: item.detail.roomId, status: item.roomStatus, postStatus: item.postStatus, rejectReason: item.rejectReason, basePrice: item.detail.rentalPrice, address: [item.detail.addressStreet, item.detail.ward, item.detail.district, item.detail.city].filter(Boolean).join(', ') }));
  const properties = [...new Map(allRooms.map((room) => [room.houseId, { houseId: room.houseId, houseName: room.houseName }])).values()];
  const available = allRooms.filter((room) => room.status === 'AVAILABLE').length;
  const occupied = allRooms.filter((room) => room.status === 'OCCUPIED').length;
  const filtered = allRooms.filter((room) => (filter === 'ALL' || room.status === filter) && (postFilter === 'ALL' || room.postStatus === postFilter) && (!houseId || room.houseId === houseId) && `${room.roomNumber} ${room.houseName} ${room.address}`.toLowerCase().includes(search.trim().toLowerCase()));
  const act = async (roomId: string, action: 'submit' | 'hide' | 'unhide') => {
    if (actionBusy) return;
    setActionBusy(roomId); setNotice(''); setActionError('');
    try { await changePostStatus(roomId, action); setNotice(action === 'submit' ? 'Đã gửi tin chờ duyệt.' : action === 'hide' ? 'Đã ẩn tin đăng.' : 'Đã hiện lại tin đăng.'); }
    catch (cause) { setActionError(cause instanceof Error ? cause.message : 'Không thể thực hiện thao tác.'); }
    finally { setActionBusy(null); }
  };
  if (!ready) return <p role="status" className="py-10 text-muted">Đang tải phòng và tin đăng…</p>;
  if (error) return <div role="alert" className="space-y-3"><p className="text-red-700">{error}</p><Button variant="outline" onClick={retry}>Thử lại</Button></div>;
  return <section className="host-listings space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Phòng và tin đăng</h1><p className="mt-1 text-sm text-muted">Quản lý phòng, trạng thái kiểm duyệt và thông tin hiển thị cho khách thuê.</p></div><div className="flex flex-wrap gap-2"><Link href="/landlord/rooms" className="rounded-xl border border-line px-3.5 py-2 text-sm font-semibold text-secondary hover:border-primary">Quản lý nhà &amp; tầng</Link><Link href="/landlord/listings/create" className="host-primary-link">Đăng phòng</Link></div></header>
    <div className="host-metrics grid grid-cols-2 sm:grid-cols-4">{[[allRooms.length, 'Tổng số phòng'], [available, 'Phòng trống'], [occupied, 'Đang thuê'], [`${allRooms.length ? Math.round(occupied / allRooms.length * 100) : 0}%`, 'Tỷ lệ lấp đầy']].map(([count, label]) => <div key={label}><span className="text-xs text-muted">{label}</span><strong className="mt-2 block text-2xl tabular-nums">{count}</strong></div>)}</div>
    {notice && <p role="status" className="rounded-sm bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
    {actionError && <p role="alert" className="rounded-sm bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
    <div className="host-room-filters"><Input aria-label="Tìm phòng" placeholder="Số phòng, tên nhà hoặc địa chỉ…" value={search} onChange={(event) => setSearch(event.target.value)} /><select aria-label="Lọc theo nhà" value={houseId} onChange={(event) => setHouseId(event.target.value)}><option value="">Tất cả nhà</option>{properties.map((house) => <option key={house.houseId} value={house.houseId}>{house.houseName}</option>)}</select><select aria-label="Tình trạng phòng" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="ALL">Tất cả tình trạng</option>{Object.entries(ROOM_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select aria-label="Trạng thái tin đăng" value={postFilter} onChange={(event) => setPostFilter(event.target.value)}><option value="ALL">Tất cả trạng thái tin</option>{Object.entries(POST_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
    <div className="flex flex-wrap items-center justify-between gap-3"><p role="status" className="text-sm text-muted">{filtered.length} phòng</p>{(houseId || search || filter !== 'ALL' || postFilter !== 'ALL') && <button className="text-sm font-semibold text-primary" onClick={() => { setHouseId(''); setSearch(''); setFilter('ALL'); setPostFilter('ALL'); }}>Xóa bộ lọc</button>}</div>
    {filtered.length ? <table className="host-room-table"><caption className="sr-only">Danh sách phòng</caption><thead><tr><th>Phòng</th><th>Nhà</th><th>Giá thuê / tháng</th><th>Phòng / tin đăng</th><th><span className="sr-only">Thao tác</span></th></tr></thead><tbody>{filtered.map((room) => <tr key={room.id}>
      <td data-label="Phòng"><strong className="block">Phòng {room.roomNumber}</strong><span className="mt-1 block text-xs text-muted">{room.area} m² · Tối đa {room.maxTenants} người</span><details className="mt-2 text-xs text-muted"><summary className="cursor-pointer">Mã phòng</summary><span className="mt-1 block break-all">{room.id}</span></details></td>
      <td data-label="Nhà"><span className="block">{room.houseName}</span><span className="mt-1 block text-xs text-muted">{room.address}</span></td>
      <td data-label="Giá thuê / tháng" className="font-semibold">{formatVND(room.basePrice)}</td>
      <td data-label="Tình trạng phòng"><Badge tone={room.status === 'AVAILABLE' ? 'green' : room.status === 'OCCUPIED' ? 'indigo' : room.status === 'RESERVED' ? 'amber' : 'gray'} dot>{ROOM_STATUS_LABELS[room.status] ?? room.status}</Badge><p className="mt-2 text-xs font-semibold">{POST_LABELS[room.postStatus]}</p>{room.rejectReason && <p className="mt-1 max-w-xs text-xs text-red-700">{room.rejectReason}</p>}</td>
      <td><div className="flex flex-wrap items-center justify-end gap-3">
        <Link href={`/landlord/listings/${room.id}`} className="text-xs font-semibold text-primary">Chi tiết</Link>
        {room.postStatus === 'APPROVED' && <Link href={`/rooms/${room.id}`} className="text-xs font-semibold text-primary">Xem phòng</Link>}
        {['DRAFT', 'REJECTED'].includes(room.postStatus) && <Link href={`/landlord/listings/create?roomId=${encodeURIComponent(room.id)}`} className="text-xs font-semibold text-primary">Sửa tin</Link>}
        {(['DRAFT', 'REJECTED'].includes(room.postStatus) ? [['submit', 'Gửi duyệt']] : room.postStatus === 'APPROVED' ? [['hide', 'Ẩn tin']] : room.postStatus === 'HIDDEN' ? [['unhide', 'Hiện tin']] : []).map(([action, label]) => <Button key={action} size="sm" variant="outline" disabled={!!actionBusy} onClick={() => void act(room.id, action as 'submit' | 'hide' | 'unhide')}>{actionBusy === room.id ? 'Đang xử lý…' : label}</Button>)}
      </div></td>
    </tr>)}</tbody></table> : <div className="border-y border-line py-12 text-center"><h2 className="font-semibold">{allRooms.length ? 'Không có phòng phù hợp' : 'Chưa có phòng'}</h2><p className="mt-2 text-sm text-muted">{allRooms.length ? 'Thử thay đổi hoặc xóa bộ lọc.' : 'Thêm nhà và tầng trước khi tạo phòng.'}</p><Link href={allRooms.length ? '/landlord/rooms' : '/landlord/listings/create'} className="mt-4 inline-block text-sm font-semibold text-primary">{allRooms.length ? 'Nhà và tầng' : 'Tạo phòng'}</Link></div>}
  </section>;
}
