'use client';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const AREAS = ['Cầu Giấy', 'Thanh Xuân', 'Đống Đa', 'Hà Đông'];
const SIZES = ['Dưới 20m²', '20–30m²', 'Trên 30m²'];
const AMENITIES = ['Điều hòa', 'Wifi', 'Máy giặt', 'Ban công', 'Bếp', 'WC riêng'];
const TYPES = ['Tất cả', 'Phòng đơn', 'Phòng đôi', 'Nguyên căn'];

export default function FilterModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [areas, setAreas] = useState<string[]>(['Thanh Xuân']);
  const [size, setSize] = useState('20–30m²');
  const [amen, setAmen] = useState<string[]>(['Điều hòa', 'Wifi']);
  const [type, setType] = useState('Tất cả');
  const [maxPrice, setMaxPrice] = useState(4);

  const toggle = (list: string[], v: string, set: (x: string[]) => void) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <Modal open={open} onClose={onClose} title="Bộ lọc" widthClass="max-w-xl">
      <div className="space-y-6">
        <section>
          <h4 className="mb-2.5 text-sm font-bold text-ink">Khu vực</h4>
          <div className="flex flex-wrap gap-2">
            {AREAS.map((a) => (
              <button key={a} onClick={() => toggle(areas, a, setAreas)} className={cn('rounded-full border px-4 py-2 text-sm font-medium transition', areas.includes(a) ? 'border-primary bg-primary-soft text-primary' : 'border-line text-ink hover:border-primary')}>
                {a}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h4 className="mb-2.5 text-sm font-bold text-ink">Giá thuê</h4>
          <input type="range" min={1} max={5} step={0.5} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-[#4F46E5]" />
          <div className="mt-1 flex justify-between text-[13px] text-muted"><span>1tr</span><span className="font-semibold text-ink">Tối đa {String(maxPrice).replace('.', ',')}tr</span><span>5tr+</span></div>
        </section>

        <section>
          <h4 className="mb-2.5 text-sm font-bold text-ink">Diện tích</h4>
          <div className="flex flex-wrap gap-2">
            {SIZES.map((s) => (
              <button key={s} onClick={() => setSize(s)} className={cn('rounded-full border px-4 py-2 text-sm font-medium transition', size === s ? 'border-primary bg-primary-soft text-primary' : 'border-line text-ink hover:border-primary')}>{s}</button>
            ))}
          </div>
        </section>

        <section>
          <h4 className="mb-2.5 text-sm font-bold text-ink">Tiện ích</h4>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {AMENITIES.map((a) => (
              <label key={a} className="flex cursor-pointer items-center gap-2 rounded-xl border border-line px-3 py-2.5 text-sm text-ink has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
                <input type="checkbox" checked={amen.includes(a)} onChange={() => toggle(amen, a, setAmen)} className="h-4 w-4 accent-[#4F46E5]" />
                {a}
              </label>
            ))}
          </div>
        </section>

        <section>
          <h4 className="mb-2.5 text-sm font-bold text-ink">Loại phòng</h4>
          <div className="flex rounded-xl bg-page p-1">
            {TYPES.map((t) => (
              <button key={t} onClick={() => setType(t)} className={cn('flex-1 rounded-lg px-2 py-2 text-[13px] font-medium transition', type === t ? 'bg-white font-bold text-ink shadow-sm' : 'text-muted')}>{t}</button>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-between border-t border-line pt-4">
          <Button variant="ghost" onClick={() => { setAreas([]); setAmen([]); setSize(''); setType('Tất cả'); }}>Xóa lọc</Button>
          <Button onClick={onClose}>Áp dụng · 24 phòng</Button>
        </div>
      </div>
    </Modal>
  );
}
