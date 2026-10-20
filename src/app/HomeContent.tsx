'use client';
import { useMemo, useState } from 'react';
import { rooms, favoriteRooms } from '@/lib/data';
import { useDebounce } from '@/hooks/useDebounce';
import RoomCard from '@/components/layouts/RoomCard';
import FilterModal from '@/components/layouts/FilterModal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { cn } from '@/lib/utils';

const CATEGORIES = ['Tất cả', 'Gần trường', 'Có ban công', 'Máy giặt', 'Nguyên căn', 'Phòng đơn', 'Phòng đôi', 'WC riêng'];

export default function HomeContent() {
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 300);
  const [category, setCategory] = useState('Tất cả');
  const [filterOpen, setFilterOpen] = useState(false);

  const favIds = useMemo(() => new Set(favoriteRooms.map((r) => r.id)), []);
  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter((r) => r.name.toLowerCase().includes(q) || r.area.toLowerCase().includes(q) || r.house.toLowerCase().includes(q));
  }, [debounced]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn('border-b-2 px-3 py-2.5 text-sm transition', category === c ? 'border-ink font-bold text-ink' : 'border-transparent font-medium text-muted hover:text-ink')}
            >
              {c}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => setFilterOpen(true)} className="rounded-full px-4 py-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></svg>
          Bộ lọc
        </Button>
      </div>

      <h1 className="mt-6 text-[28px] font-extrabold text-ink">Tìm phòng</h1>
      <p className="mt-1 text-sm text-muted">128 phòng đang trống</p>

      <div className="mt-4 max-w-xl">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo khu vực, tên nhà..."
          icon={(
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
          )}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">Không tìm thấy phòng phù hợp. Thử từ khóa khác nhé.</p>
      ) : (
        <div className="mt-7 grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((room) => (
            <RoomCard key={room.id} room={room} favorite={favIds.has(room.id)} />
          ))}
        </div>
      )}

      <FilterModal open={filterOpen} onClose={() => setFilterOpen(false)} />
    </div>
  );
}
