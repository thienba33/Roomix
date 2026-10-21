'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { rooms } from '@/lib/data';
import { formatPriceShort } from '@/lib/utils';
import { KEY_AI_CONTEXT } from '@/lib/tenant-store';
import { BotAvatar } from 'bot-avatars';
import type { Room } from '@/types';

const QUICK = ['Phòng dưới 3 triệu gần Bách Khoa', 'Phòng trống ở Cầu Giấy?', 'So sánh phòng 302 và 405', 'Tư vấn phòng cho 2 người'];
const CHIPS = ['Gợi ý phòng', 'Giá điện nước', 'Tiện ích', 'Gặp chủ trọ'];

interface RoomHit {
  room: Room;
  pct: number;
}

interface AiMessage {
  id: number;
  role: 'user' | 'ai';
  text: string;
  hits?: RoomHit[];
  criteria?: string[];
  followUps?: string[];
}

const AMENITY_KEYWORDS = ['Điều hòa', 'Máy giặt', 'Ban công', 'WC riêng', 'Bếp', 'Gác lửng'];
const AREA_KEYWORDS = ['Cầu Giấy', 'Thanh Xuân', 'Đống Đa', 'Hà Đông'];

let msgSeq = 0;
const nextId = () => ++msgSeq;

/** Initial exchange — same content the panel previously hard-coded, now held
 * in the conversation state so follow-ups build on it. */
function initialMessages(): AiMessage[] {
  const hits: RoomHit[] = [
    { room: rooms[0], pct: 98 },
    { room: rooms[5], pct: 92 },
  ];
  return [
    { id: nextId(), role: 'user', text: 'Tìm phòng dưới 3 triệu, 2 người, có điều hòa' },
    {
      id: nextId(),
      role: 'ai',
      text: 'Có 2 phòng khớp nhất với bạn:',
      hits,
      criteria: ['≤ 3 triệu', '2 người', 'Điều hòa'],
      followUps: CHIPS,
    },
  ];
}

interface Extracted {
  maxPrice?: number;
  people?: number;
  amenities: string[];
  area?: string;
  chips: string[];
}

function extractCriteria(text: string): Extracted {
  const lower = text.toLowerCase();
  const chips: string[] = [];
  const out: Extracted = { amenities: [], chips };

  const priceMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*triệu/);
  if (priceMatch) {
    out.maxPrice = parseFloat(priceMatch[1].replace(',', '.')) * 1_000_000;
    chips.push(`≤ ${priceMatch[1].replace('.', ',')} triệu`);
  }
  const peopleMatch = lower.match(/(\d+)\s*người/);
  if (peopleMatch) {
    out.people = Number(peopleMatch[1]);
    chips.push(`${peopleMatch[1]} người`);
  }
  for (const a of AMENITY_KEYWORDS) {
    if (lower.includes(a.toLowerCase())) {
      out.amenities.push(a);
      chips.push(a);
    }
  }
  for (const area of AREA_KEYWORDS) {
    if (lower.includes(area.toLowerCase())) {
      out.area = area;
      chips.push(area);
    }
  }
  if (lower.includes('bách khoa')) chips.push('Gần Bách Khoa');
  return out;
}

function scoreHits(candidates: Room[], c: Extracted): RoomHit[] {
  const total = 1 + c.amenities.length + (c.maxPrice ? 1 : 0) + (c.area ? 1 : 0);
  return candidates
    .map((room) => {
      let matched = 1; // baseline: a real room from the catalogue
      if (c.maxPrice && room.price <= c.maxPrice) matched += 1;
      if (c.area && room.area === c.area) matched += 1;
      matched += c.amenities.filter((a) => room.amenities.includes(a)).length;
      const pct = Math.min(99, Math.round(84 + (matched / total) * 15));
      return { room, pct };
    })
    .sort((a, b) => b.pct - a.pct || a.room.price - b.room.price)
    .slice(0, 3);
}

/** Mock reply engine over the catalogue — the seam where rag-service
 * POST /api/v1/chat (ChatResponse: answer, matched_rooms, suggested_follow_ups)
 * will plug in. Criteria chips mirror UC06.2, hits mirror UC06.4. */
function buildReply(raw: string): AiMessage {
  const text = raw.trim();
  const lower = text.toLowerCase();
  const c = extractCriteria(text);
  const base: AiMessage = { id: nextId(), role: 'ai', text: '' };

  if (lower.includes('điện') || lower.includes('nước')) {
    return {
      ...base,
      text: 'Giá tham khảo tại các nhà Roomix: điện 3.500đ/số, nước 12.000đ/khối. Tổng chi phí điện nước trung bình khoảng 350.000–450.000đ/tháng cho 2 người. Mở chi tiết từng phòng để xem ước tính theo phòng.',
      followUps: ['Gợi ý phòng', 'Tiện ích', 'Gặp chủ trọ'],
    };
  }

  if (lower.includes('gặp chủ trọ') || lower.includes('liên hệ') || lower.includes('số điện thoại')) {
    return {
      ...base,
      text: 'SĐT và Zalo của chủ trọ chỉ mở khi yêu cầu quan tâm của bạn được chấp nhận (Contact Card). Bạn mở trang chi tiết phòng và bấm “Gửi yêu cầu quan tâm” nhé — chủ trọ phản hồi ngay trong mục Yêu cầu của tôi.',
      followUps: ['Gợi ý phòng', 'Giá điện nước', 'Tiện ích'],
    };
  }

  if (lower.includes('tiện ích')) {
    return {
      ...base,
      text: 'Hầu hết phòng Roomix có Điều hòa, Wifi, WC riêng và Nóng lạnh. Phòng 302 và 405 đầy đủ nhất (thêm Máy giặt, Ban công, Bếp, Tủ lạnh). Bạn muốn mình lọc theo tiện ích nào?',
      criteria: c.chips.length ? c.chips : undefined,
      followUps: ['Phòng có ban công', 'Phòng có máy giặt', 'Giá điện nước'],
    };
  }

  const codes = [...lower.matchAll(/\b(302|405|201|510|102|303)\b/g)].map((m) => Number(m[1]));
  if ((lower.includes('so sánh') || codes.length >= 2) && codes.length >= 1) {
    const picked = rooms.filter((r) => codes.includes(r.id));
    if (picked.length) {
      const lines = picked.map((r) => `${r.name}: ${formatPriceShort(r.price)}/tháng, ${r.size} m², ${r.amenities.length} tiện ích`).join(' · ');
      return {
        ...base,
        text: `So sánh nhanh — ${lines}. Phòng rẻ hơn trong nhóm là lựa chọn tiết kiệm; phòng diện tích lớn hơn hợp ở 2 người lâu dài.`,
        hits: picked.map((room, i) => ({ room, pct: 96 - i * 4 })),
        followUps: ['Giá điện nước', 'Gặp chủ trọ', 'Gợi ý phòng'],
      };
    }
  }

  let pool = rooms.filter((r) => r.status === 'AVAILABLE' || r.status === 'RESERVED');
  if (c.area) pool = pool.filter((r) => r.area === c.area);
  if (c.maxPrice) pool = pool.filter((r) => r.price <= (c.maxPrice as number));
  for (const a of c.amenities) pool = pool.filter((r) => r.amenities.includes(a));

  if (pool.length === 0) {
    const relaxed = rooms.filter((r) => !c.maxPrice || r.price <= c.maxPrice + 500_000);
    return {
      ...base,
      text: 'Chưa có phòng khớp hết tiêu chí của bạn. Đây là các lựa chọn gần nhất — nới khoảng giá thêm một chút sẽ có thêm phòng.',
      hits: scoreHits(relaxed.length ? relaxed : rooms, c),
      criteria: c.chips.length ? c.chips : undefined,
      followUps: ['Phòng dưới 3 triệu', 'Phòng ở Thanh Xuân', 'Tư vấn phòng cho 2 người'],
    };
  }

  return {
    ...base,
    text:
      c.chips.length > 0
        ? `Mình tìm thấy ${pool.length} phòng khớp tiêu chí của bạn:`
        : 'Đây là các phòng còn trống nổi bật hiện tại:',
    hits: scoreHits(pool, c),
    criteria: c.chips.length ? c.chips : undefined,
    followUps: ['Giá điện nước', 'Phòng có ban công', 'So sánh phòng 302 và 405'],
  };
}

export default function AiPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<AiMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Shared panel (not built on Modal/Drawer), so Esc-to-close is wired here once.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // UC06.5: a room context handed over from the detail page ("Hỏi AI về phòng này").
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(KEY_AI_CONTEXT);
      if (!raw) return;
      window.sessionStorage.removeItem(KEY_AI_CONTEXT);
      const { roomId } = JSON.parse(raw) as { roomId?: number };
      const room = rooms.find((r) => r.id === roomId);
      if (!room) return;
      setMessages((m) => [
        ...m,
        {
          id: nextId(),
          role: 'ai',
          text: `Bạn đang xem ${room.name} — ${formatPriceShort(room.price)}/tháng, ${room.size} m², tầng ${room.floor}, tiện ích: ${room.amenities.join(', ')}. Cứ hỏi mình thêm về phòng này, hoặc bấm “Gửi yêu cầu quan tâm” ở trang chi tiết khi sẵn sàng.`,
          hits: [{ room, pct: 100 }],
          followUps: ['Giá điện nước', 'Gặp chủ trọ', 'Gợi ý phòng tương tự'],
        },
      ]);
    } catch {
      /* malformed context — panel works without it */
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const reply = buildReply(text);
    setMessages((m) => [...m, { id: nextId(), role: 'user', text }, reply]);
  };

  const lastAi = [...messages].reverse().find((m) => m.role === 'ai');
  const bottomChips = lastAi?.followUps ?? CHIPS;

  return (
    <aside className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-[440px] flex-col border-l border-line bg-white shadow-2xl">
      <div className="bg-sea-gradient flex items-center gap-3 px-5 py-4 text-white">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
          <BotAvatar type="droid" color="#4F46E5" size={36} />
        </span>
        <div className="flex-1">
          <p className="font-bold leading-tight">Roomix AI</p>
          <p className="text-[13px] text-white/85">Hỏi gì về phòng cũng được</p>
        </div>
        <button onClick={onClose} aria-label="Đóng panel AI" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/20">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center">
            <BotAvatar type="droid" color="#4F46E5" size={44} />
          </span>
          <div>
            <p className="font-bold text-ink">Xin chào, Minh Anh</p>
            <p className="text-sm text-muted">Mình giúp gì cho bạn hôm nay?</p>
          </div>
        </div>

        <p className="mt-6 text-[11px] font-bold tracking-wider text-muted">GỢI Ý NHANH</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {QUICK.map((q) => (
            <button key={q} onClick={() => send(q)} className="flex items-start gap-2 rounded-xl border border-line bg-white px-3 py-2.5 text-left text-[13px] font-medium text-ink transition hover:border-sea hover:bg-sky-pale">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sea" />
              {q}
            </button>
          ))}
        </div>

        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={m.id} className="mt-5 flex justify-end">
              <p className="max-w-[85%] rounded-2xl bg-sky-light px-4 py-3 text-sm text-ink">{m.text}</p>
            </div>
          ) : (
            <div key={m.id}>
              <div className="mt-4 rounded-2xl border border-sky-light bg-sky-pale p-4">
                <p className="text-sm font-semibold leading-relaxed text-ink">{m.text}</p>
                {m.hits && m.hits.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {m.hits.map(({ room, pct }) => (
                      <Link key={room.id} href={`/rooms/${room.id}`} className="flex items-center gap-3 rounded-lg transition hover:bg-white/60">
                        <Image src={room.image} alt={room.name} width={56} height={44} className="h-11 w-14 rounded-lg object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">{room.name}</p>
                          <p className="text-[13px] text-muted">{formatPriceShort(room.price)}/tháng</p>
                        </div>
                        <span className="rounded-full bg-sky-light px-2 py-0.5 text-xs font-bold text-sea-dark">{pct}%</span>
                      </Link>
                    ))}
                  </div>
                )}
                {m.criteria && m.criteria.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {m.criteria.map((chip) => (
                      <span key={chip} className="rounded-full bg-sky-light px-2.5 py-1 text-xs font-medium text-sea-dark">{chip}</span>
                    ))}
                  </div>
                )}
                {m.followUps && m.followUps.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {m.followUps.map((f) => (
                      <button key={f} onClick={() => send(f)} className="rounded-full border border-sea/40 bg-white px-2.5 py-1 text-xs font-medium text-sea-dark transition hover:bg-sky-light">
                        {f}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {i === 1 && (
                <div className="mt-4 rounded-2xl bg-sky-pale p-4 text-sm text-ink">
                  <span className="mr-1 text-sea">✦</span>
                  <span className="font-semibold">Mẹo:</span> hỏi giá điện nước từng phòng để so sánh chi phí thật.
                </div>
              )}
            </div>
          ),
        )}

        <div className="mt-6">
          <div className="flex flex-wrap gap-2">
            {bottomChips.map((chip) => (
              <button key={chip} onClick={() => send(chip)} className="rounded-full border border-line px-3.5 py-1.5 text-[13px] font-medium text-ink transition hover:border-sea hover:text-sea-dark">{chip}</button>
            ))}
          </div>
          <form
            className="mt-3 flex items-center gap-2 rounded-full border border-line bg-white py-1.5 pl-4 pr-1.5 focus-within:border-sea"
            onSubmit={(e) => { e.preventDefault(); if (input.trim()) { send(input); setInput(''); } }}
          >
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Nhắn cho Roomix AI..." aria-label="Nhắn cho Roomix AI" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/70" />
            <button type="submit" aria-label="Gửi" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sea-dark text-white transition hover:bg-sea-blue">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
