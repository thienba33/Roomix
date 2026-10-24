'use client';
import { useEffect, useState } from 'react';
import { useCatalog } from '@/hooks/useCatalog';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import RoomListingCard from '@/components/rooms/RoomListingCard';
import { searchRooms, CATALOG_EVENT, type RoomSearch } from '@/services/mock/rooms';

const AMENITIES = [{ value: 'private_bathroom', label: 'WC riêng' }, { value: 'air_conditioner', label: 'Điều hòa' }, { value: 'water_heater', label: 'Nóng lạnh' }, { value: 'balcony', label: 'Ban công' }];
const SEARCH_KEY = 'roomix_mock_room_search_v1';
const PAGE_SIZE = 16;
const INITIAL: RoomSearch = { location: '', sort: 'newest', page: 0, size: PAGE_SIZE, amenities: [] };

export default function HomeContent() {
  const catalog = useCatalog();
  const [query, setQuery] = useState<RoomSearch>(INITIAL);
  const [draft, setDraft] = useState<RoomSearch>(INITIAL);
  const [open, setOpen] = useState(false);
  const [aiNotes, setAiNotes] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [filterError, setFilterError] = useState('');
  useEffect(() => {
    const restore = () => {
      try {
        const saved = JSON.parse(localStorage.getItem(SEARCH_KEY) || 'null');
        if (saved) {
          const restored = { ...saved, size: PAGE_SIZE, page: saved.size === PAGE_SIZE ? saved.page ?? 0 : 0 };
          const result = searchRooms(restored);
          setQuery({ ...restored, page: Math.max(0, Math.min(restored.page, result.totalPages - 1)) });
        }
      } catch { /* Invalid preferences use the default search. */ }
      try { const notes = JSON.parse(sessionStorage.getItem('roomix:tenant:ai-search-notes') || '[]'); setAiNotes(Array.isArray(notes) ? notes.filter((n): n is string => typeof n === 'string') : []); } catch { setAiNotes([]); }
      setReady(true);
    };
    restore();
    window.addEventListener('roomix:tenant:search-applied', restore);
    return () => window.removeEventListener('roomix:tenant:search-applied', restore);
  }, []);
  useEffect(() => {
    if (ready) { try { localStorage.setItem(SEARCH_KEY, JSON.stringify(query)); } catch { /* Search remains usable without storage. */ } }
  }, [query, ready]);
  useEffect(() => {
    const resetPage = () => setQuery((q) => ({ ...q, page: 0 }));
    window.addEventListener(CATALOG_EVENT, resetPage);
    window.addEventListener('storage', resetPage);
    return () => { window.removeEventListener(CATALOG_EVENT, resetPage); window.removeEventListener('storage', resetPage); };
  }, []);
  const update = (value: Partial<RoomSearch>) => setQuery((q) => ({ ...q, ...value, page: 0 }));
  let result; let error = catalog.error;
  try { result = searchRooms(query); } catch (e) { error = e instanceof Error ? e.message : 'Không thể tìm phòng.'; }
  const count = [query.minPrice, query.maxPrice, query.minArea].filter((v) => v !== undefined).length + (query.amenities?.length ?? 0);
  const reset = () => {
    setQuery(INITIAL);
    setAiNotes([]);
    try { sessionStorage.removeItem('roomix:tenant:ai-search-notes'); } catch { /* Optional persistence. */ }
  };
  const apply = () => {
    try { searchRooms(draft); setQuery({ ...draft, page: 0 }); setOpen(false); setFilterError(''); }
    catch (e) { setFilterError(e instanceof Error ? e.message : 'Bộ lọc không hợp lệ.'); }
  };
  return <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
    <h1 className="text-[28px] font-extrabold text-ink">Tìm phòng</h1>
    <Input value={query.location ?? ''} onChange={(e) => update({ location: e.target.value })} placeholder="Tìm theo đường, phường, quận hoặc thành phố…" aria-label="Tìm theo địa chỉ" className="mt-4 h-[52px]" />
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <p role="status" className="mr-auto text-sm text-muted">{ready ? `${result?.totalElements ?? 0} phòng phù hợp` : 'Đang tải phòng…'}</p>
      <label className="flex items-center gap-2 text-sm">Sắp xếp
        <select className="rounded-full border border-line bg-white px-3 py-2" value={query.sort} onChange={(e) => update({ sort: e.target.value as RoomSearch['sort'] })}>
          <option value="newest">Mới nhất</option><option value="price_asc">Giá tăng dần</option><option value="price_desc">Giá giảm dần</option>
        </select>
      </label>
      <Button variant="outline" onClick={() => { setDraft(query); setFilterError(''); setOpen(true); }}>Bộ lọc{count ? ` · ${count}` : ''}</Button>
      {(count > 0 || query.location) && <button className="text-sm font-semibold text-primary" onClick={reset}>Xóa bộ lọc</button>}
    </div>
    {aiNotes.length > 0 && <p className="mt-3 text-sm text-muted">Cần xác nhận thêm: {aiNotes.join(' · ')}</p>}
    {error && <div role="alert" className="mt-6 rounded-xl border border-line p-5"><p className="text-red-600">{error}</p><Button className="mt-3" variant="outline" onClick={() => { catalog.retry(); reset(); }}>Thử lại</Button></div>}
    {ready && !error && result && (result.content.length ? <>
      <div className="room-grid mt-7 gap-x-5 gap-y-8">{result.content.map((room) => <RoomListingCard key={room.postId} room={room} />)}</div>
      <nav aria-label="Phân trang phòng" className="mt-8 flex items-center justify-center gap-3">
        <button type="button" aria-label="Trang trước" title="Trang trước" disabled={result.first} onClick={() => setQuery((q) => ({ ...q, page: result.page - 1 }))} className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-35">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <span role="status" aria-live="polite" aria-label={`Trang ${result.page + 1} trên ${result.totalPages}`} className="min-w-12 text-center text-sm tabular-nums text-muted"><span className="font-semibold text-ink">{result.page + 1}</span><span aria-hidden="true" className="px-1.5">/</span>{result.totalPages}</span>
        <button type="button" aria-label="Trang sau" title="Trang sau" disabled={result.last} onClick={() => setQuery((q) => ({ ...q, page: result.page + 1 }))} className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-35">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
        </button>
      </nav>
    </> : <div className="py-20 text-center"><h2 className="font-bold">Không tìm thấy phòng phù hợp</h2><p className="mt-2 text-sm text-muted">Thử thay đổi khu vực hoặc bỏ bớt bộ lọc.</p><Button className="mt-5" variant="outline" onClick={reset}>Xóa bộ lọc</Button></div>)}
    <Modal open={open} onClose={() => setOpen(false)} title="Bộ lọc phòng">
      <form onSubmit={(e) => { e.preventDefault(); apply(); }} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Giá từ (đ/tháng)" name="minPrice" type="number" min="0" value={draft.minPrice ?? ''} onChange={(e) => setDraft((d) => ({ ...d, minPrice: e.target.value === '' ? undefined : Number(e.target.value) }))} />
          <Input label="Giá đến (đ/tháng)" name="maxPrice" type="number" min="0" value={draft.maxPrice ?? ''} onChange={(e) => setDraft((d) => ({ ...d, maxPrice: e.target.value === '' ? undefined : Number(e.target.value) }))} />
        </div>
        <Input label="Diện tích tối thiểu (m²)" name="minArea" type="number" min="0.1" step="any" value={draft.minArea ?? ''} onChange={(e) => setDraft((d) => ({ ...d, minArea: e.target.value === '' ? undefined : Number(e.target.value) }))} />
        <fieldset><legend className="mb-3 text-sm font-bold">Tiện ích</legend><div className="grid grid-cols-2 gap-3">{AMENITIES.map((a) => <label key={a.value} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.amenities?.includes(a.value) ?? false} onChange={(e) => setDraft((d) => ({ ...d, amenities: e.target.checked ? [...(d.amenities ?? []), a.value] : d.amenities?.filter((v) => v !== a.value) }))} />{a.label}</label>)}</div></fieldset>
        <p role="alert" className="text-sm text-red-600">{filterError}</p>
        <div className="flex justify-between gap-3"><Button type="button" variant="ghost" onClick={() => setDraft({ ...INITIAL, location: query.location, sort: query.sort, size: query.size })}>Đặt lại</Button><Button type="submit">Áp dụng</Button></div>
      </form>
    </Modal>
  </div>;
}
