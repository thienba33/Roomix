'use client';
import { useMemo, useState, type ReactNode } from 'react';
import { rooms, favoriteRooms } from '@/lib/data';
import { useDebounce } from '@/hooks/useDebounce';
import RoomCard from '@/components/layouts/RoomCard';
import FilterModal from '@/components/layouts/FilterModal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { cn } from '@/lib/utils';

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
  {
    label: 'Gần trường',
    icon: (
      <svg {...iconProps}><path d="m2 9 10-5 10 5-10 5z" /><path d="M6 11.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5" /><path d="M22 9v5" /></svg>
    ),
  },
  {
    label: 'Ban công',
    icon: (
      <svg {...iconProps}><rect x="5" y="3" width="14" height="18" rx="1" /><path d="M5 12h14" /><path d="M9 21v-4M15 21v-4" /><path d="M9 7h2M13 7h2" /></svg>
    ),
  },
  {
    label: 'Máy giặt',
    icon: (
      <svg {...iconProps}><rect x="4" y="2.5" width="16" height="19" rx="2" /><circle cx="12" cy="13" r="4.5" /><path d="M7 5.5h.01M17 5.5h.01" /></svg>
    ),
  },
];

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
    <div className="w-full px-6 py-6 lg:px-12">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.label}
              onClick={() => setCategory(c.label)}
              className={cn('flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm transition', category === c.label ? 'border-ink font-bold text-ink' : 'border-transparent font-medium text-muted hover:text-ink')}
            >
              {c.icon}
              {c.label}
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

      <div className="mt-4">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo khu vực, tên nhà..."
          className="h-[52px] rounded-xl text-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">Không tìm thấy phòng phù hợp. Thử từ khóa khác nhé.</p>
      ) : (
        <div className="mt-7 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((room) => (
            <RoomCard key={room.id} room={room} favorite={favIds.has(room.id)} />
          ))}
        </div>
      )}

      <FilterModal open={filterOpen} onClose={() => setFilterOpen(false)} />
    </div>
  );
}
