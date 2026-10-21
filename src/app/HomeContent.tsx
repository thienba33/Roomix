'use client';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { rooms } from '@/lib/data';
import { useDebounce } from '@/hooks/useDebounce';
import RoomCard from '@/components/layouts/RoomCard';
import FilterModal from '@/components/layouts/FilterModal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import {
  DEFAULT_FILTERS,
  SORT_OPTIONS,
  applyRoomFilters,
  getPersistedSearch,
  isDefaultFilters,
  persistSearch,
  type SortKey,
  type TenantFilters,
} from '@/lib/tenant-store';

const iconProps = {
  width: 17,
  height: 17,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const CATEGORIES: { label: string; icon: ReactNode }[] = [
  {
    label: 'Tất cả',
    icon: (
      <svg {...iconProps}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
    ),
  },
  {
    label: 'Phòng đơn',
    icon: (
      <svg {...iconProps}><path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6" /><path d="M3 18h18" /><path d="M3 21v-3M21 21v-3" /><path d="M7 10V8a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" /></svg>
    ),
  },
  {
    label: 'Phòng đôi',
    icon: (
      <svg {...iconProps}><path d="M2 18v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5" /><path d="M2 18h20" /><path d="M2 21v-3M22 21v-3" /><path d="M6 11V9a2 2 0 0 1 2-2h3v4M13 11V9a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" /></svg>
    ),
  },
  {
    label: 'Nguyên căn',
    icon: (
      <svg {...iconProps}><path d="m3 10 9-7 9 7" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" /></svg>
    ),
  },
];

function fmtPrice(n: number) {
  return `${String(n).replace('.', ',')}tr`;
}

export default function HomeContent() {
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 300);
  const [category, setCategory] = useState('Tất cả');
  const [filters, setFilters] = useState<TenantFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortKey>('newest');
  const [filterOpen, setFilterOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [aiNotes, setAiNotes] = useState<string[]>([]);

  // Read on mount and when AI applies criteria while this route remains mounted.
  useEffect(() => {
    const restore = () => {
      const saved = getPersistedSearch();
      if (saved) {
        setQuery(saved.query ?? '');
        setCategory(saved.category && CATEGORIES.some((c) => c.label === saved.category) ? saved.category : 'Tất cả');
        setFilters({ ...DEFAULT_FILTERS, ...(saved.filters ?? {}) });
        setSort(saved.sort ?? 'newest');
      }
      try { const notes = JSON.parse(sessionStorage.getItem('roomix:tenant:ai-search-notes') || '[]'); setAiNotes(Array.isArray(notes) ? notes : []); } catch { setAiNotes([]); }
      setHydrated(true);
    };
    restore();
    window.addEventListener('roomix:tenant:search-applied', restore);
    return () => window.removeEventListener('roomix:tenant:search-applied', restore);
  }, []);

  useEffect(() => {
    if (hydrated) persistSearch({ query, category, filters, sort });
  }, [hydrated, query, category, filters, sort]);

  const filtered = useMemo(
    () => applyRoomFilters(rooms, { query: debounced, category, filters, sort }),
    [debounced, category, filters, sort],
  );

  const filtersActive = !isDefaultFilters(filters);
  const hasAnyCriteria = filtersActive || category !== 'Tất cả' || debounced.trim() !== '';

  const clearAll = () => {
    setFilters(DEFAULT_FILTERS);
    setCategory('Tất cả');
    setQuery('');
    setAiNotes([]);
    try { sessionStorage.removeItem('roomix:tenant:ai-search-notes'); } catch { /* Optional storage. */ }
  };

  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (filtersActive) {
    if (filters.priceLo !== DEFAULT_FILTERS.priceLo || filters.priceHi !== DEFAULT_FILTERS.priceHi) {
      chips.push({
        key: 'price',
        label: `${fmtPrice(filters.priceLo)} — ${fmtPrice(filters.priceHi)}`,
        clear: () => setFilters((f) => ({ ...f, priceLo: DEFAULT_FILTERS.priceLo, priceHi: DEFAULT_FILTERS.priceHi })),
      });
    }
    if (filters.size) {
      chips.push({ key: 'size', label: filters.size, clear: () => setFilters((f) => ({ ...f, size: '' })) });
    }
    if (filters.type !== 'Tất cả') {
      chips.push({ key: 'type', label: filters.type, clear: () => setFilters((f) => ({ ...f, type: 'Tất cả' })) });
    }
    filters.amenities.forEach((a) =>
      chips.push({
        key: `amen-${a}`,
        label: a,
        clear: () => setFilters((f) => ({ ...f, amenities: f.amenities.filter((x) => x !== a) })),
      }),
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.label}
              onClick={() => setCategory(c.label)}
              aria-pressed={category === c.label}
              className={cn('flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm transition', category === c.label ? 'border-ink font-bold text-ink' : 'border-transparent font-medium text-muted hover:text-ink')}
            >
              {c.icon}
              {c.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          <span className="hidden sm:inline">Sắp xếp</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sắp xếp kết quả"
            className="h-9 rounded-full border border-line bg-white px-3 text-sm font-medium text-ink outline-none transition focus:border-ink"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <Button variant="outline" size="sm" onClick={() => setFilterOpen(true)} className={cn('rounded-full px-4 py-2', filtersActive && 'border-primary font-bold text-primary')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></svg>
          Bộ lọc{filtersActive ? ` · ${chips.length}` : ''}
        </Button>
      </div>

      <h1 className="mt-6 text-[28px] font-extrabold text-ink">Tìm phòng</h1>
      <p className="mt-1 text-sm text-muted" aria-live="polite">Hiển thị {filtered.length} / {rooms.length} phòng</p>

      <div className="mt-4">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo khu vực, tên nhà..."
          aria-label="Tìm phòng theo khu vực hoặc tên nhà"
          className="h-[52px] rounded-xl text-sm"
        />
      </div>

      {aiNotes.length > 0 && <p role="status" className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Cần xác nhận thêm: {aiNotes.join(' · ')}</p>}
      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <span key={chip.key} className="flex items-center gap-1.5 rounded-full bg-primary-soft py-1.5 pl-3 pr-2 text-[13px] font-medium text-primary">
              {chip.label}
              <button onClick={chip.clear} aria-label={`Bỏ lọc ${chip.label}`} className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-white">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </span>
          ))}
          <button onClick={clearAll} className="text-[13px] font-semibold text-primary hover:underline">Xóa tất cả</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[17px] font-semibold text-ink">Không tìm thấy phòng phù hợp</p>
          <p className="mx-auto mt-2 max-w-[420px] text-sm text-muted">
            Không có phòng nào khớp với tiêu chí hiện tại. Thử nới khoảng giá hoặc bỏ bớt tiện ích nhé.
          </p>
          {hasAnyCriteria && (
            <Button variant="outline" className="mt-6" onClick={clearAll}>Xóa bộ lọc</Button>
          )}
          <p className="mt-4 text-sm text-muted">
            Hoặc <Link href="/ai" className="font-semibold text-primary hover:underline">hỏi Roomix AI</Link> để được gợi ý thêm.
          </p>
        </div>
      ) : (
        <div className="mt-7 room-grid gap-x-5 gap-y-8">
          {filtered.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}

      <FilterModal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        value={filters}
        onApply={setFilters}
        query={debounced}
        category={category}
        sort={sort}
      />
    </div>
  );
}
