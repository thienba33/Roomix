'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { formatVND, formatPriceShort } from '@/lib/utils';
import { landlord } from '@/lib/data';
import type { Room } from '@/types';
import {
  KEY_AI_CONTEXT,
  OPEN_AI_EVENT,
  createRequest,
  getActiveRequestForRoom,
  getFavoriteIds,
  toggleFavoriteId,
  type TenantRequest,
} from '@/lib/tenant-store';

interface Props {
  room: Room;
  breakdown: { label: string; amount: number }[];
  total: number;
}

/**
 * Interactive half of A2 (UC02.5/UC02.6/UC02.8 + Favorite):
 * sends the interest request, blocks duplicates, and keeps the Contact Card
 * locked until a request for this room is ACCEPTED.
 */
export default function RoomDetailActions({ room, breakdown, total }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [existing, setExisting] = useState<TenantRequest | undefined>(undefined);
  const [note, setNote] = useState('');
  const [fav, setFav] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setExisting(getActiveRequestForRoom(room.id));
    setFav(getFavoriteIds().includes(room.id));
    setHydrated(true);
  }, [room.id]);

  const send = () => {
    if (getActiveRequestForRoom(room.id)) {
      setExisting(getActiveRequestForRoom(room.id));
      return;
    }
    const req = createRequest(room, note);
    setExisting(req);
    toast.push('Đã gửi yêu cầu quan tâm', `Chủ trọ sẽ phản hồi qua mục Yêu cầu của tôi.`, {
      label: 'Xem yêu cầu',
      onClick: () => router.push('/requests'),
    });
  };

  const askAi = () => {
    try {
      window.sessionStorage.setItem(KEY_AI_CONTEXT, JSON.stringify({ roomId: room.id }));
    } catch {
      /* session storage unavailable — panel opens without room context */
    }
    window.dispatchEvent(new CustomEvent(OPEN_AI_EVENT));
  };

  const accepted = existing?.status === 'ACCEPTED';

  return (
    <>
      <Card className="p-6">
        <div className="flex items-start justify-between gap-3">
          <p className="text-2xl font-extrabold text-ink">
            {formatPriceShort(room.price)} <span className="text-base font-medium text-muted">/ tháng</span>
          </p>
          <button
            onClick={() => setFav(toggleFavoriteId(room.id))}
            aria-label={fav ? 'Bỏ yêu thích phòng này' : 'Lưu phòng này vào yêu thích'}
            aria-pressed={fav}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line transition hover:scale-105"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={fav ? '#4F46E5' : 'none'} stroke={fav ? '#4F46E5' : 'currentColor'} strokeWidth="1.8" strokeLinejoin="round" className="text-muted">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-sm text-ink">
          <span className="font-bold">Chi phí mỗi tháng</span>{' '}
          <span className="text-[13px] text-muted">ước tính theo chỉ số trung bình</span>
        </p>

        <div className="mt-4 divide-y divide-line/70">
          {breakdown.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-3 py-2.5 text-sm">
              <span className="text-muted">{row.label}</span>
              <span className="shrink-0 font-medium text-ink">{formatVND(row.amount)}</span>
            </div>
          ))}
        </div>

        <div className="mt-2 flex items-baseline justify-between border-t border-line pt-4">
          <span className="font-bold text-ink">Tổng dự kiến</span>
          <span className="text-lg font-extrabold text-ink">{formatVND(total)}</span>
        </div>

        {existing ? (
          <div className="mt-5">
            <Button size="lg" className="w-full" disabled>
              {accepted ? 'Yêu cầu đã được chấp nhận' : 'Đã gửi yêu cầu · Đang chờ'}
            </Button>
            <p className="mt-2.5 text-center text-[13px] text-muted">
              Đã gửi {existing.date} · Theo dõi ở{' '}
              <button onClick={() => router.push('/requests')} className="font-semibold text-primary hover:underline">Yêu cầu của tôi</button>
            </p>
          </div>
        ) : (
          <div className="mt-5">
            <label htmlFor="interest-note" className="mb-1.5 block text-[13px] font-semibold text-ink">
              Lời nhắn cho chủ trọ <span className="font-medium text-muted">(không bắt buộc)</span>
            </label>
            <textarea
              id="interest-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder="VD: Em muốn thuê từ đầu tháng sau, ở 2 người…"
              className="w-full resize-none rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-ink focus:ring-1 focus:ring-ink/15"
            />
            <Button size="lg" className="mt-3 w-full" onClick={send} disabled={!hydrated}>
              Gửi yêu cầu quan tâm
            </Button>
          </div>
        )}
      </Card>

      <Card className="mt-5 p-6">
        {accepted ? (
          <>
            <p className="font-bold text-ink">Thông tin liên hệ chủ trọ</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink">
              SĐT {landlord.phone} · Zalo · {landlord.email}
            </p>
            <p className="mt-1 text-[13px] text-muted">Contact Card đã mở vì yêu cầu của bạn được chấp nhận.</p>
          </>
        ) : (
          <>
            <p className="font-bold text-ink">Thông tin liên hệ đang khóa</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Gửi yêu cầu quan tâm — chủ trọ chấp nhận mới mở SĐT và Zalo.
            </p>
          </>
        )}
        <Button variant="outline" size="lg" className="mt-4 w-full" onClick={askAi}>Hỏi AI về phòng này</Button>
      </Card>
    </>
  );
}
