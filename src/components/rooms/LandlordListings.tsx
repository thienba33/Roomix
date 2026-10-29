'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApiData } from '@/hooks/useApiData';
import { listLandlordOverview, PROPERTIES_EVENT, type LandlordPropertyOverview } from '@/services/backend/properties';
import { changePostStatus, CATALOG_EVENT } from '@/services/backend/rooms';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ROOM_STATUS_LABELS } from '@/components/landlord/presentation';
import { formatVND } from '@/lib/utils';

const EMPTY: LandlordPropertyOverview[] = [];
export default function LandlordListings({ initialHouse = '' }: { initialHouse?: string }) {
  const { data: properties, ready, error, retry } = useApiData('landlord-overview', listLandlordOverview, EMPTY, PROPERTIES_EVENT);
  const [filter, setFilter] = useState('ALL');
  const [houseId, setHouseId] = useState(initialHouse);
  const [search, setSearch] = useState('');
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  useEffect(() => { window.addEventListener(CATALOG_EVENT, retry); return () => window.removeEventListener(CATALOG_EVENT, retry); }, [retry]);
  const allRooms = properties.flatMap((property) => property.rooms.map((room) => ({ ...room, houseId: property.houseId, houseName: property.houseName, address: property.address })));
  const available = allRooms.filter((room) => room.status === 'AVAILABLE').length;
  const occupied = allRooms.filter((room) => room.status === 'OCCUPIED').length;
  const filtered = allRooms.filter((room) => (filter === 'ALL' || room.status === filter) && (!houseId || room.houseId === houseId) && `${room.roomNumber} ${room.houseName} ${room.address}`.toLowerCase().includes(search.trim().toLowerCase()));
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
    <header className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">Phòng và tin đăng</h1><Link href="/landlord/listings/create" className="host-primary-link">Đăng phòng</Link></header>
    <div className="host-metrics grid grid-cols-2 sm:grid-cols-4">{[[allRooms.length, 'Tổng số phòng'], [available, 'Phòng trống'], [occupied, 'Đang thuê'], [`${allRooms.length ? Math.round(occupied / allRooms.length * 100) : 0}%`, 'Tỷ lệ lấp đầy']].map(([count, label]) => <div key={label}><span className="text-xs text-muted">{label}</span><strong className="mt-2 block text-2xl tabular-nums">{count}</strong></div>)}</div>
    {notice && <p role="status" className="rounded-sm bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
    {actionError && <p role="alert" className="rounded-sm bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
    <div className="host-room-filters"><Input aria-label="Tìm phòng" placeholder="Số phòng, tên nhà hoặc địa chỉ…" value={search} onChange={(event) => setSearch(event.target.value)} /><select aria-label="Lọc theo nhà" value={houseId} onChange={(event) => setHouseId(event.target.value)}><option value="">Tất cả nhà</option>{properties.map((house) => <option key={house.houseId} value={house.houseId}>{house.houseName}</option>)}</select><select aria-label="Tình trạng phòng" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="ALL">Tất cả tình trạng</option>{Object.entries(ROOM_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
    <div className="flex flex-wrap items-center justify-between gap-3"><p role="status" className="text-sm text-muted">{filtered.length} phòng</p>{(houseId || search || filter !== 'ALL') && <button className="text-sm font-semibold text-primary" onClick={() => { setHouseId(''); setSearch(''); setFilter('ALL'); }}>Xóa bộ lọc</button>}</div>
    {filtered.length ? <table className="host-room-table"><caption className="sr-only">Danh sách phòng</caption><thead><tr><th>Phòng</th><th>Nhà</th><th>Giá thuê / tháng</th><th>Tình trạng phòng</th><th><span className="sr-only">Thao tác</span></th></tr></thead><tbody>{filtered.map((room) => <tr key={room.id}>
      <td data-label="Phòng"><strong className="block">Phòng {room.roomNumber}</strong><span className="mt-1 block text-xs text-muted">{room.area} m² · Tối đa {room.maxTenants} người</span><details className="mt-2 text-xs text-muted"><summary className="cursor-pointer">Mã phòng</summary><span className="mt-1 block break-all">{room.id}</span></details></td>
      <td data-label="Nhà"><span className="block">{room.houseName}</span><span className="mt-1 block text-xs text-muted">{room.address}</span></td>
      <td data-label="Giá thuê / tháng" className="font-semibold">{formatVND(room.basePrice)}</td>
      <td data-label="Tình trạng phòng"><Badge tone={room.status === 'AVAILABLE' ? 'green' : room.status === 'OCCUPIED' ? 'indigo' : room.status === 'RESERVED' ? 'amber' : 'gray'} dot>{ROOM_STATUS_LABELS[room.status] ?? room.status}</Badge></td>
      <td><div className="flex flex-wrap items-center justify-end gap-3"><Link href={`/rooms/${room.id}`} className="text-xs font-semibold text-primary">Xem phòng</Link><details className="host-room-actions"><summary className="cursor-pointer rounded-sm border border-line px-3 py-2 text-xs font-semibold">Thao tác</summary><div>{([['submit', 'Gửi duyệt'], ['hide', 'Ẩn tin'], ['unhide', 'Hiện tin']] as const).map(([action, label]) => <Button key={action} size="sm" variant="ghost" disabled={!!actionBusy} onClick={() => void act(room.id, action)}>{actionBusy === room.id ? 'Đang xử lý…' : label}</Button>)}</div></details></div></td>
    </tr>)}</tbody></table> : <div className="border-y border-line py-12 text-center"><h2 className="font-semibold">{allRooms.length ? 'Không có phòng phù hợp' : 'Chưa có phòng'}</h2><p className="mt-2 text-sm text-muted">{allRooms.length ? 'Thử thay đổi hoặc xóa bộ lọc.' : 'Thêm nhà và tầng trước khi tạo phòng.'}</p><Link href={allRooms.length ? '/landlord/rooms' : '/landlord/listings/create'} className="mt-4 inline-block text-sm font-semibold text-primary">{allRooms.length ? 'Nhà và tầng' : 'Tạo phòng'}</Link></div>}
    <p className="text-xs text-muted">Trạng thái tin đăng chưa được cung cấp trong danh sách này.</p>
  </section>;
}
