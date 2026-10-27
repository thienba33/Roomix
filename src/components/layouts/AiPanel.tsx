'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import ChatIcon from '@/components/ui/ChatIcon';
import Button from '@/components/ui/Button';
import { sendAiMessage, type ChatMessage, type MatchedRoom } from '@/services/ai';
import { formatVND } from '@/lib/utils';
import { readSession } from '@/services/backend/session';

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  matchedRooms?: MatchedRoom[];
  followUps?: string[];
  createdAt: string;
}

const DEFAULT_SUGGESTIONS = [
  'Tìm phòng trọ dưới 4 triệu có gác lửng và máy lạnh',
  'Quy định pháp lý về hợp đồng thuê và tiền cọc',
  'Cách tính chỉ số điện nước hàng tháng',
  'Phòng trọ gần trung tâm cho sinh viên',
];

export default function AiPanel({
  onClose,
  width,
}: {
  onClose: () => void;
  width: number;
  maxWidth: number;
  onWidthChange: (width: number) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Xin chào! Tôi là Roomix AI — Trợ lý thông minh hỗ trợ tìm kiếm phòng trọ, gợi ý mức giá tối ưu và giải đáp các quy định hợp đồng, điện nước, cọc phòng theo chuẩn nghiệp vụ.',
      followUps: DEFAULT_SUGGESTIONS,
      createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const sync = () => setMobile(media.matches);
    sync();
    media.addEventListener('change', sync);
    const escape = (event: KeyboardEvent) => {
      if (!media.matches && event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', escape);
    return () => {
      media.removeEventListener('change', sync);
      window.removeEventListener('keydown', escape);
    };
  }, [onClose]);

  useEffect(() => {
    if (window.matchMedia('(max-width: 767px)').matches) return;
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus({ preventScroll: true });
    return () => {
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);

  useDialogFocus(ref, mobile, onClose);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || busy) return;

    const userMessage: DisplayMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setBusy(true);

    try {
      const history: ChatMessage[] = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const session = readSession();
      const userRole = session?.user.role === 'LANDLORD' ? 'LANDLORD' : 'TENANT';

      const response = await sendAiMessage({
        message: text,
        conversation_history: history,
        user_role: userRole,
      });

      const assistantMessage: DisplayMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        matchedRooms: response.matched_rooms,
        followUps: response.suggested_follow_ups?.length
          ? response.suggested_follow_ups
          : undefined,
        createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: DisplayMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content:
          err instanceof Error
            ? `Rất tiếc, đã có lỗi xử lý: ${err.message}`
            : 'Hệ thống AI hiện chưa thể phản hồi. Vui lòng thử lại sau ít phút.',
        createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void handleSend();
  };

  return (
    <aside
      id="roomix-ai"
      ref={ref}
      role={mobile ? 'dialog' : 'complementary'}
      aria-modal={mobile || undefined}
      aria-labelledby="ai-heading"
      tabIndex={-1}
      style={{ width: mobile ? undefined : width }}
      className="ai-panel flex flex-col bg-page text-ink shadow-[-8px_0_32px_-24px_rgba(34,34,34,0.3)] h-full overflow-hidden"
    >
      {/* Header */}
      <header className="flex items-center justify-between border-b border-line bg-white px-5 py-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ChatIcon size={20} />
          </div>
          <div>
            <h2 id="ai-heading" className="text-base font-bold leading-5">Roomix AI</h2>
            <p className="text-xs text-muted">Trợ lý tư vấn &amp; tìm phòng thông minh</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng Roomix AI"
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-page transition text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-primary"
        >
          ✕
        </button>
      </header>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-none'
                  : 'bg-white text-ink border border-line rounded-bl-none'
              }`}
            >
              <div className="whitespace-pre-wrap break-words">{msg.content}</div>

              {/* Matched Rooms List */}
              {msg.matchedRooms && msg.matchedRooms.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-line/50 pt-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">
                    Phòng gợi ý phù hợp:
                  </p>
                  <div className="grid gap-2">
                    {msg.matchedRooms.map((room) => (
                      <Link
                        key={room.id}
                        href={`/rooms/${room.id}`}
                        onClick={onClose}
                        className="group block rounded-xl border border-line bg-page/50 p-2.5 transition hover:border-primary hover:bg-white"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-ink group-hover:text-primary line-clamp-1">
                            {room.title}
                          </span>
                          <span className="shrink-0 font-bold text-primary">
                            {room.price ? formatVND(room.price) : ''}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted line-clamp-1">
                          {[room.address, room.district, room.city].filter(Boolean).join(', ')}
                          {room.area_sqm ? ` · ${room.area_sqm} m²` : ''}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <span className="mt-1 px-1 text-[11px] text-muted">{msg.createdAt}</span>

            {/* Suggested Follow-ups */}
            {msg.followUps && msg.followUps.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5 max-w-[90%]">
                {msg.followUps.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={busy}
                    onClick={() => void handleSend(prompt)}
                    className="rounded-full border border-line bg-white px-3 py-1 text-xs text-secondary transition hover:border-primary hover:text-primary hover:bg-primary-soft/30 text-left disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {busy && (
          <div className="flex items-center gap-2 text-xs text-muted p-2">
            <span className="inline-block h-2 w-2 animate-ping rounded-full bg-primary" />
            Roomix AI đang phân tích dữ liệu và soạn câu trả lời…
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <footer className="border-t border-line bg-white p-3 shrink-0">
        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
            placeholder="Hỏi về phòng, giá, tiền cọc, hợp đồng..."
            className="flex-1 rounded-xl border border-line bg-page px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-primary focus-visible:bg-white"
          />
          <Button type="submit" size="sm" disabled={busy || !input.trim()}>
            Gửi
          </Button>
        </form>
      </footer>
    </aside>
  );
}
