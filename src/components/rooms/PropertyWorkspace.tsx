'use client';

import { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { useApiData } from '@/hooks/useApiData';
import {
  createFloor, createHouse, deleteFloor, deleteHouse, listProperties,
  PROPERTIES_EVENT, updateFloor, updateHouse,
  type Floor, type FloorInput, type House, type HouseInput,
} from '@/services/backend/properties';

const EMPTY: House[] = [];
type Target = { kind: 'house' | 'floor'; action: 'create' | 'edit' | 'delete'; house?: House; floor?: Floor };

export default function PropertyWorkspace() {
  const { data: houses, ready, error, retry } = useApiData('landlord-properties', listProperties, EMPTY, PROPERTIES_EVENT);
  const [selectedId, setSelectedId] = useState('');
  const [target, setTarget] = useState<Target | null>(null);
  const [notice, setNotice] = useState('');
  const selected = houses.find((house) => house.id === selectedId) ?? houses[0];
  const finish = (message: string) => { setTarget(null); setNotice(message); };

  return <div className="space-y-7 pb-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-[28px] font-extrabold tracking-tight sm:text-[32px]">Nhà &amp; Phòng</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Danh sách nhà và tầng được tải từ backend theo tài khoản của bạn. Thêm tầng trước khi tạo phòng.</p></div><Button onClick={() => setTarget({ kind: 'house', action: 'create' })}>Thêm nhà</Button></header>
    {notice && <p role="status" className="rounded-xl bg-primary-soft px-4 py-3 text-sm text-primary">{notice}</p>}
    {!ready ? <p role="status" className="rounded-2xl border border-line p-8 text-muted">Đang tải danh sách nhà…</p>
      : error ? <div role="alert" className="rounded-2xl border border-red-200 p-6"><p className="text-red-700">{error}</p><Button variant="outline" className="mt-4" onClick={retry}>Thử lại</Button></div>
        : !houses.length ? <div className="rounded-2xl border border-line p-8"><h2 className="text-lg font-bold">Chưa có nhà nào</h2><p className="mt-2 text-sm text-muted">Thêm nhà rồi tạo tầng để chuẩn bị đăng phòng.</p><Button className="mt-5" onClick={() => setTarget({ kind: 'house', action: 'create' })}>Thêm nhà đầu tiên</Button></div>
          : <div className="grid gap-5 lg:grid-cols-[270px_minmax(0,1fr)]"><nav aria-label="Danh sách nhà" className="space-y-2">{houses.map((house) => <button key={house.id} type="button" aria-current={selected?.id === house.id ? 'true' : undefined} onClick={() => setSelectedId(house.id)} className={`w-full rounded-xl border px-4 py-3 text-left focus-visible:outline-2 focus-visible:outline-primary ${selected?.id === house.id ? 'border-primary bg-primary-soft' : 'border-line bg-white hover:border-primary/40'}`}><span className="block break-words text-sm font-bold">{house.name}</span><span className="mt-1 block text-xs text-muted">{house.floors.length} tầng</span></button>)}</nav>
            {selected && <section aria-label={`Nhà ${selected.name}`} className="min-w-0 space-y-6 rounded-2xl border border-line bg-white p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><h2 className="break-words text-xl font-bold">{selected.name}</h2><p className="mt-2 break-words text-sm text-muted">{[selected.addressStreet, selected.ward, selected.district, selected.city].filter(Boolean).join(', ')}</p>{selected.description && <p className="mt-3 whitespace-pre-line text-sm leading-6">{selected.description}</p>}<p className="mt-2 text-xs text-muted">Số tầng khai báo: {selected.totalFloors}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setTarget({ kind: 'house', action: 'edit', house: selected })}>Sửa nhà</Button><Button size="sm" variant="outline" onClick={() => setTarget({ kind: 'house', action: 'delete', house: selected })}>Xóa nhà</Button></div></div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5"><h3 className="text-base font-bold">Các tầng</h3><Button size="sm" onClick={() => setTarget({ kind: 'floor', action: 'create', house: selected })}>Thêm tầng</Button></div>
              {selected.floors.length ? <div className="grid gap-3 sm:grid-cols-2">{selected.floors.map((floor) => <article key={floor.id} className="rounded-xl border border-line p-4"><h4 className="font-semibold">{floor.name}</h4><p className="mt-1 text-xs text-muted">Tầng {floor.floorNumber}</p>{floor.description && <p className="mt-2 whitespace-pre-line text-sm text-muted">{floor.description}</p>}<div className="mt-4 flex gap-2"><Button size="sm" variant="outline" onClick={() => setTarget({ kind: 'floor', action: 'edit', house: selected, floor })}>Sửa</Button><Button size="sm" variant="outline" onClick={() => setTarget({ kind: 'floor', action: 'delete', house: selected, floor })}>Xóa</Button></div></article>)}</div> : <p className="rounded-xl bg-page p-5 text-sm text-muted">Nhà này chưa có tầng.</p>}
              <div className="border-t border-line pt-5"><h3 className="font-semibold">Phòng và tin đăng</h3><p className="mt-2 text-sm leading-6 text-muted">Nhà và tầng ở trên đã được tải từ API. Backend hiện chưa có API liệt kê phòng và tin nháp của chủ trọ, nên chưa thể hiển thị danh sách phòng tại đây.</p>{selected.floors.length > 0 && <Link href="/landlord/listings/create" className="mt-4 inline-flex rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-primary hover:border-primary">Tạo phòng &amp; tin nháp</Link>}</div>
            </section>}</div>}
    <Modal open={!!target} onClose={() => setTarget(null)} title={target?.action === 'delete' ? `Xóa ${target.kind === 'house' ? 'nhà' : 'tầng'}` : `${target?.action === 'edit' ? 'Sửa' : 'Thêm'} ${target?.kind === 'house' ? 'nhà' : 'tầng'}`}>
      {target && <PropertyForm key={`${target.kind}:${target.action}:${target.house?.id ?? ''}:${target.floor?.id ?? ''}`} target={target} onClose={() => setTarget(null)} onSaved={finish} />}
    </Modal>
  </div>;
}

function PropertyForm({ target, onClose, onSaved }: { target: Target; onClose: () => void; onSaved: (message: string) => void }) {
  const house = target.house;
  const floor = target.floor;
  const [houseValue, setHouseValue] = useState({ name: target.action === 'edit' ? house?.name ?? '' : '', addressStreet: target.action === 'edit' ? house?.addressStreet ?? '' : '', ward: target.action === 'edit' ? house?.ward ?? '' : '', district: target.action === 'edit' ? house?.district ?? '' : '', city: target.action === 'edit' ? house?.city ?? '' : '', totalFloors: String(target.action === 'edit' ? house?.totalFloors ?? 1 : 1), description: target.action === 'edit' ? house?.description ?? '' : '' });
  const [floorValue, setFloorValue] = useState({ name: floor?.name ?? '', floorNumber: String(floor?.floorNumber ?? 1), description: floor?.description ?? '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const run = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError('');
    try {
      if (target.action === 'delete') {
        if (target.kind === 'floor' && house && floor) await deleteFloor(house.id, floor.id);
        else if (house) await deleteHouse(house.id);
        onSaved(target.kind === 'house' ? 'Đã xóa nhà.' : 'Đã xóa tầng.');
      } else if (target.kind === 'house') {
        const input: HouseInput = { name: houseValue.name.trim(), addressStreet: houseValue.addressStreet.trim(), ward: houseValue.ward.trim(), district: houseValue.district.trim(), city: houseValue.city.trim(), totalFloors: Number(houseValue.totalFloors), description: houseValue.description.trim() || null, latitude: house?.latitude ?? null, longitude: house?.longitude ?? null };
        if (target.action === 'edit' && house) await updateHouse(house.id, input);
        else await createHouse(input);
        onSaved(target.action === 'edit' ? 'Đã cập nhật nhà.' : 'Đã thêm nhà. Bạn có thể tạo tầng cho nhà này.');
      } else if (house) {
        const input: FloorInput = { name: floorValue.name.trim(), floorNumber: Number(floorValue.floorNumber), description: floorValue.description.trim() || null };
        if (target.action === 'edit' && floor) await updateFloor(house.id, floor.id, input);
        else await createFloor(house.id, input);
        onSaved(target.action === 'edit' ? 'Đã cập nhật tầng.' : 'Đã thêm tầng.');
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể thực hiện thao tác.'); busyRef.current = false; setBusy(false); }
  };
  const houseField = (key: keyof typeof houseValue, label: string, maxLength: number) => <Input id={`house-${key}`} label={label} required maxLength={maxLength} value={houseValue[key]} onChange={(event) => setHouseValue((previous) => ({ ...previous, [key]: event.target.value }))} />;
  return <form onSubmit={(event) => void run(event)} className="space-y-4">
    {target.action === 'delete' ? <p className="text-sm leading-6">Bạn muốn xóa <strong>{floor?.name ?? house?.name}</strong>? Backend sẽ từ chối nếu nhà hoặc tầng đang có phòng.</p>
      : target.kind === 'house' ? <>{houseField('name', 'Tên nhà', 150)}{houseField('addressStreet', 'Số nhà, đường', 255)}<div className="grid gap-4 sm:grid-cols-2">{houseField('ward', 'Phường/xã', 100)}{houseField('district', 'Quận/huyện', 100)}</div>{houseField('city', 'Tỉnh/thành phố', 100)}<Input id="house-totalFloors" label="Tổng số tầng" type="number" required min={1} step={1} value={houseValue.totalFloors} onChange={(event) => setHouseValue((previous) => ({ ...previous, totalFloors: event.target.value }))} /><label htmlFor="house-description" className="block text-[13px] font-semibold">Mô tả (không bắt buộc)<textarea id="house-description" maxLength={5000} rows={3} className="mt-1.5 w-full rounded-xl border border-line p-3 text-sm" value={houseValue.description} onChange={(event) => setHouseValue((previous) => ({ ...previous, description: event.target.value }))} /></label></>
        : <><p className="text-sm text-muted">Thuộc nhà {house?.name}</p><Input id="floor-name" label="Tên tầng" required maxLength={100} value={floorValue.name} onChange={(event) => setFloorValue((previous) => ({ ...previous, name: event.target.value }))} /><Input id="floor-number" label="Số tầng" type="number" required min={1} max={house?.totalFloors} step={1} value={floorValue.floorNumber} onChange={(event) => setFloorValue((previous) => ({ ...previous, floorNumber: event.target.value }))} /><label htmlFor="floor-description" className="block text-[13px] font-semibold">Mô tả (không bắt buộc)<textarea id="floor-description" maxLength={500} rows={3} className="mt-1.5 w-full rounded-xl border border-line p-3 text-sm" value={floorValue.description} onChange={(event) => setFloorValue((previous) => ({ ...previous, description: event.target.value }))} /></label></>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Hủy</Button><Button type="submit" disabled={busy}>{busy ? 'Đang xử lý…' : target.action === 'delete' ? 'Xóa' : target.action === 'edit' ? 'Lưu thay đổi' : `Thêm ${target.kind === 'house' ? 'nhà' : 'tầng'}`}</Button></div>
  </form>;
}
