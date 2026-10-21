import { rooms } from '@/lib/data';
import { formatPriceShort } from '@/lib/utils';
import type { Room } from '@/types';

export interface RoomHit { room: Room; reason: string; }
export interface AiMessage { id: string; role: 'user' | 'ai'; text: string; hits?: RoomHit[]; criteria?: string[]; followUps?: string[]; sources?: string[]; search?: Extracted; }
const nextId = () => crypto.randomUUID();
const AMENITY_KEYWORDS = ['Điều hòa', 'Máy giặt', 'Ban công', 'WC riêng', 'Bếp', 'Gác lửng'];
const AREA_KEYWORDS = ['Cầu Giấy', 'Thanh Xuân', 'Đống Đa', 'Hà Đông'];


export interface Extracted {
  maxPrice?: number;
  people?: number;
  nearSchool?: boolean;
  amenities: string[];
  area?: string;
  chips: string[];
}

export function extractCriteria(text: string): Extracted {
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
  if (lower.includes('bách khoa')) { out.nearSchool = true; chips.push('Gần Bách Khoa'); }
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
      return { room, score: matched / total, reason: [c.area && room.area === c.area ? room.area : '', c.maxPrice && room.price <= c.maxPrice ? 'Trong ngân sách' : '', ...c.amenities.filter((a) => room.amenities.includes(a))].filter(Boolean).join(' · ') || 'Phòng đang có trong danh sách' };
    })
    .sort((a, b) => b.score - a.score || a.room.price - b.room.price)
    .slice(0, 3);
}

function buildReply(raw: string): AiMessage {
  const text = raw.trim();
  const lower = text.toLowerCase();
  const c = extractCriteria(text);
  const base: AiMessage = { id: nextId(), role: 'ai', text: '' };

  if (lower.includes('điện') || lower.includes('nước')) {
    return {
      ...base,
      text: 'Chưa có đơn giá điện nước được xác minh cho từng phòng trong dữ liệu minh họa. Bạn có thể xem bảng chi phí ước tính ở trang chi tiết và xác nhận với chủ trọ khi yêu cầu được chấp nhận.',
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
      text: `Các tiện ích có trong danh sách minh họa: ${[...new Set(rooms.flatMap((room) => room.amenities))].join(', ')}. Bạn muốn lọc theo tiện ích nào?`,
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
        text: `So sánh nhanh — ${lines}. Bạn có thể mở chi tiết để đối chiếu tiện ích và xác nhận sức chứa.`,
        hits: picked.map((room) => ({ room, reason: 'Phòng bạn muốn so sánh' })),
        followUps: ['Giá điện nước', 'Gặp chủ trọ', 'Gợi ý phòng'],
      };
    }
  }

  let pool = rooms.filter((r) => r.status === 'AVAILABLE');
  if (c.area) pool = pool.filter((r) => r.area === c.area);
  if (c.maxPrice) pool = pool.filter((r) => r.price <= (c.maxPrice as number));
  for (const a of c.amenities) pool = pool.filter((r) => r.amenities.includes(a));

  if (pool.length === 0) {
    const relaxed = rooms.filter((r) => r.status === 'AVAILABLE');
    return {
      ...base,
      text: 'Chưa có phòng khớp hết tiêu chí của bạn. Đây là các lựa chọn gần nhất — mỗi phòng bên dưới ghi rõ điểm khác với yêu cầu.',
      hits: scoreHits(relaxed, c).map((hit) => ({ ...hit, reason: [c.area && hit.room.area !== c.area ? `Khác khu vực: ${hit.room.area}` : '', c.maxPrice && hit.room.price > c.maxPrice ? 'Vượt ngân sách' : '', ...c.amenities.filter((a) => !hit.room.amenities.includes(a)).map((a) => `Chưa có ${a.toLowerCase()}`)].filter(Boolean).join(' · ') || hit.reason })),
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


export async function sendAiMessage(text: string, history: AiMessage[], roomId?: number): Promise<AiMessage> {
  // Mock transport. A future adapter maps ChatResponse without inventing sources.
  await new Promise((resolve) => setTimeout(resolve, 250));
  const room = rooms.find((item) => item.id === roomId);
  if (room && !/gợi ý|tìm phòng|so sánh/i.test(text)) {
    const response = buildReply(text);
    if (/gặp chủ trọ|liên hệ|số điện thoại/i.test(text)) return response;
    if (/điện|nước/i.test(text)) return { ...response, text: `${room.name}: ${response.text}` };
    return { id: nextId(), role: 'ai', text: `${room.name}: ${formatPriceShort(room.price)}/tháng, ${room.size} m², ${room.area}. Tiện ích đã ghi nhận: ${room.amenities.join(', ')}. Những thông tin khác cần xác nhận với chủ trọ.`, hits: [{ room, reason: 'Phòng bạn đang hỏi' }], followUps: ['Gợi ý phòng tương tự', 'Gặp chủ trọ'] };
  }
  const previous = [...history].reverse().find((item) => item.role === 'ai' && item.search)?.search;
  const extracted = extractCriteria(text);
  const follows = /^(thêm|có |ở |dưới |và |phòng có|phòng dưới|phòng ở)/i.test(text);
  const search = previous && follows ? { ...previous, ...extracted, maxPrice: extracted.maxPrice ?? previous.maxPrice, area: extracted.area ?? previous.area, people: extracted.people ?? previous.people, nearSchool: extracted.nearSchool ?? previous.nearSchool, amenities: [...new Set([...previous.amenities, ...extracted.amenities])], chips: [] as string[] } : extracted;
  search.chips = [search.maxPrice ? `≤ ${search.maxPrice / 1_000_000} triệu` : '', search.area || '', search.people ? `${search.people} người (cần xác nhận)` : '', ...search.amenities, search.nearSchool ? 'Gần Bách Khoa (cần xác nhận)' : ''].filter(Boolean);
  const query = follows && previous ? `${search.maxPrice ? `dưới ${search.maxPrice / 1_000_000} triệu` : ''} ${search.area || ''} ${search.amenities.join(' ')} ${search.people ? `${search.people} người` : ''}` : text;
  const reply = buildReply(query);
  if (reply.hits) return { ...reply, criteria: search.chips, search, text: reply.text + (search.people ? ' Sức chứa cần được xác nhận với chủ trọ.' : '') + (search.nearSchool ? ' Chưa đủ dữ liệu để xác nhận khoảng cách đến Bách Khoa.' : '') };
  return reply;
}
