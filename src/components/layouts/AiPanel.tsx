'use client';
import { useState } from 'react';
import Image from 'next/image';

const QUICK = ['Phòng dưới 3 triệu gần Bách Khoa', 'Phòng trống ở Cầu Giấy?', 'So sánh phòng 302 và 405', 'Tư vấn phòng cho 2 người'];
const CHIPS = ['Gợi ý phòng', 'Giá điện nước', 'Tiện ích', 'Gặp chủ trọ'];

export default function AiPanel({ onClose }: { onClose: () => void }) {
  const [extraMsg, setExtraMsg] = useState<string | null>(null);
  const [input, setInput] = useState('');

  return (
    <aside className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-[440px] flex-col border-l border-line bg-white shadow-2xl">
      <div className="bg-sea-gradient flex items-center gap-3 px-5 py-4 text-white">
        <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/20">
          <Image src="/images/ai-icon.png" alt="Roomix AI" width={26} height={26} />
        </span>
        <div className="flex-1">
          <p className="font-bold leading-tight">Roomix AI</p>
          <p className="text-[13px] text-white/85">Hỏi gì về phòng cũng được</p>
        </div>
        <button onClick={onClose} aria-label="Đóng panel AI" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/20">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="flex items-center gap-3">
          <span className="bg-sea-gradient flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full">
            <Image src="/images/ai-icon.png" alt="" width={24} height={24} className="brightness-0 invert" />
          </span>
          <div>
            <p className="font-bold text-ink">Xin chào, Minh Anh</p>
            <p className="text-sm text-muted">Mình giúp gì cho bạn hôm nay?</p>
          </div>
        </div>

        <p className="mt-6 text-[11px] font-bold tracking-wider text-muted">GỢI Ý NHANH</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {QUICK.map((q) => (
            <button key={q} onClick={() => setExtraMsg(q)} className="flex items-start gap-2 rounded-xl border border-line bg-white px-3 py-2.5 text-left text-[13px] font-medium text-ink transition hover:border-sea hover:bg-sky-pale">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sea" />
              {q}
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <p className="max-w-[85%] rounded-2xl rounded-tr-md bg-sky-light px-4 py-3 text-sm text-ink">Tìm phòng dưới 3 triệu, 2 người, có điều hòa</p>
        </div>

        <div className="mt-4 rounded-2xl border border-sky-light bg-sky-pale p-4">
          <p className="text-sm font-semibold text-ink">Có 2 phòng khớp nhất với bạn:</p>
          <div className="mt-3 space-y-3">
            {[
              { img: '/images/rooms/room-302-a.jpg', name: 'Phòng 302 — Lê Văn Lương', price: '2,8 tr/tháng', pct: '98%' },
              { img: '/images/rooms/room-303.jpg', name: 'Phòng 310 — Thanh Xuân', price: '2,9 tr/tháng', pct: '92%' },
            ].map((r) => (
              <div key={r.name} className="flex items-center gap-3">
                <Image src={r.img} alt={r.name} width={56} height={44} className="h-11 w-14 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{r.name}</p>
                  <p className="text-[13px] text-muted">{r.price}</p>
                </div>
                <span className="rounded-full bg-sky-light px-2 py-0.5 text-xs font-bold text-sea-dark">{r.pct}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {['≤ 3 triệu', '2 người', 'Điều hòa'].map((c) => (
              <span key={c} className="rounded-full bg-sky-light px-2.5 py-1 text-xs font-medium text-sea-dark">{c}</span>
            ))}
          </div>
        </div>

        {extraMsg && (
          <>
            <div className="mt-5 flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-tr-md bg-sky-light px-4 py-3 text-sm text-ink">{extraMsg}</p>
            </div>
            <p className="mt-3 text-sm text-muted">Mình đã ghi nhận — xem các phòng gợi ý ở danh sách bên trái nhé.</p>
          </>
        )}

        <div className="mt-4 rounded-2xl bg-sky-pale p-4 text-sm text-ink">
          <span className="mr-1 text-sea">✦</span>
          <span className="font-semibold">Mẹo:</span> hỏi giá điện nước từng phòng để so sánh chi phí thật.
        </div>

        <div className="mt-6">
          <div className="flex flex-wrap gap-2">
            {CHIPS.map((c) => (
              <button key={c} onClick={() => setExtraMsg(c)} className="rounded-full border border-line px-3.5 py-1.5 text-[13px] font-medium text-ink transition hover:border-sea hover:text-sea-dark">{c}</button>
            ))}
          </div>
          <form
            className="mt-3 flex items-center gap-2 rounded-full border border-line bg-white py-1.5 pl-4 pr-1.5 focus-within:border-sea"
            onSubmit={(e) => { e.preventDefault(); if (input.trim()) { setExtraMsg(input.trim()); setInput(''); } }}
          >
            <span className="text-lg leading-none text-muted">+</span>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Nhắn cho Roomix AI..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/70" />
            <button type="submit" aria-label="Gửi" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sea-dark text-white transition hover:bg-sea-blue">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
