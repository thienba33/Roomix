'use client';
import { useEffect, useMemo, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { rooms } from '@/lib/data';
import {
  DEFAULT_FILTERS,
  applyRoomFilters,
  type SortKey,
  type TenantFilters,
} from '@/lib/tenant-store';

const SIZES = ['Dưới 20m²', '20–30m²', 'Trên 30m²'];
const AMENITIES = ['Điều hòa', 'Máy giặt', 'Ban công', 'Gác lửng', 'WC riêng', 'Bếp', 'Gửi xe', 'Thang máy'];
const TYPES = ['Tất cả', 'Phòng trọ', 'Chung cư mini', 'KTX'];

const PRICE_MIN = 1;
const PRICE_MAX = 5;

const thumbClass =
  'pointer-events-none absolute inset-x-0 top-1/2 h-6 w-full -translate-y-1/2 appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-white';

function fmtPrice(n: number) {
  return `${String(n).replace('.', ',')}tr`;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Currently applied filters — the draft starts from these. */
  value: TenantFilters;
  onApply: (filters: TenantFilters) => void;
  /** Page context the modal cannot see, so the live count stays exact. */
  query?: string;
  category?: string;
  sort?: SortKey;
}

export default function FilterModal({ open, onClose, value, onApply, query = '', category = 'Tất cả', sort = 'newest' }: Props) {
  const [draft, setDraft] = useState<TenantFilters>(value);

  // Re-seed the draft from the applied filters every time the modal opens.
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const toggleAmen = (v: string) =>
    setDraft((d) => ({ ...d, amenities: d.amenities.includes(v) ? d.amenities.filter((x) => x !== v) : [...d.amenities, v] }));

  const reset = () => setDraft(DEFAULT_FILTERS);

  // Live result count for the draft, combined with the page's query/category.
  const liveCount = useMemo(
    () => applyRoomFilters(rooms, { query, category, filters: draft, sort }).length,
    [draft, query, category, sort],
  );

  const loPct = ((draft.priceLo - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
  const hiPct = ((draft.priceHi - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;

  return (
    <Modal open={open} onClose={onClose} title="Bộ lọc nâng cao" widthClass="max-w-[720px]">
      <div className="space-y-7 px-1 pb-1 pt-1">
        <section>
          <h4 className="text-[15px] font-bold text-ink">Khoảng giá / tháng</h4>
          <div className="relative mt-5 h-6">
            <div className="absolute inset-x-0 top-1/2 h-[5px] -translate-y-1/2 rounded-full bg-line" />
            <div
              className="absolute top-1/2 h-[5px] -translate-y-1/2 rounded-full bg-primary"
              style={{ left: `${loPct}%`, width: `${hiPct - loPct}%` }}
            />
            <input
              type="range"
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={0.5}
              value={draft.priceLo}
              onChange={(e) => setDraft((d) => ({ ...d, priceLo: Math.min(Number(e.target.value), d.priceHi - 0.5) }))}
              className={thumbClass}
              aria-label="Giá tối thiểu"
            />
            <input
              type="range"
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={0.5}
              value={draft.priceHi}
              onChange={(e) => setDraft((d) => ({ ...d, priceHi: Math.max(Number(e.target.value), d.priceLo + 0.5) }))}
              className={thumbClass}
              aria-label="Giá tối đa"
            />
          </div>
          <p className="mt-1.5 text-[13px] text-muted">{fmtPrice(draft.priceLo)} — {fmtPrice(draft.priceHi)}</p>
        </section>

        <section>
          <h4 className="text-[15px] font-bold text-ink">Diện tích</h4>
          <div className="mt-3 flex flex-wrap gap-2">
            {SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setDraft((d) => ({ ...d, size: d.size === s ? '' : s }))}
                aria-pressed={draft.size === s}
                className={cn('rounded-full px-5 py-2.5 text-sm font-medium transition', draft.size === s ? 'bg-primary font-semibold text-white' : 'bg-page text-ink hover:bg-line/60')}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h4 className="text-[15px] font-bold text-ink">Tiện ích</h4>
          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3.5">
            {AMENITIES.map((a) => {
              const checked = draft.amenities.includes(a);
              return (
                <button key={a} onClick={() => toggleAmen(a)} aria-pressed={checked} className="flex items-center gap-2.5 text-left text-sm text-ink">
                  <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border transition', checked ? 'border-primary bg-primary text-white' : 'border-line bg-white text-transparent')}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  </span>
                  {a}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h4 className="text-[15px] font-bold text-ink">Loại phòng</h4>
          <div className="mt-3 flex rounded-xl bg-page p-1">
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setDraft((d) => ({ ...d, type: t }))}
                aria-pressed={draft.type === t}
                className={cn('flex-1 rounded-lg px-2 py-2.5 text-sm transition', draft.type === t ? 'bg-white font-bold text-ink shadow-sm' : 'font-medium text-muted hover:text-ink')}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-between pt-1">
          <button onClick={reset} className="text-sm font-semibold text-primary hover:underline">Xóa lọc</button>
          <Button
            onClick={() => {
              onApply(draft);
              onClose();
            }}
            className="rounded-xl px-6 py-3"
          >
            Áp dụng · {liveCount} phòng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
