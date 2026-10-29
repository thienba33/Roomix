'use client';

import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import Button from '@/components/ui/Button';
import { sendAiMessage, type ChatMessage, type MatchedRoom } from '@/services/ai';
import { formatVND } from '@/lib/utils';
import { AUTH_EVENT, readSession } from '@/services/backend/session';

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

function getChatStorageKey(userId?: string): string {
  return `roomix_chat_history_${userId || 'guest'}`;
}

function getWelcomeMessage(): DisplayMessage {
  return {
    id: 'welcome',
    role: 'assistant',
    content:
      'Xin chào! Tôi là Roomix AI — Trợ lý thông minh hỗ trợ tìm kiếm phòng trọ, gợi ý mức giá tối ưu và giải đáp các quy định hợp đồng, điện nước, cọc phòng theo chuẩn nghiệp vụ.',
    followUps: DEFAULT_SUGGESTIONS,
    createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
  };
}

function renderCleanContent(content: string) {
  if (!content) return null;
  const normalized = content.replace(/~\s*/g, 'khoảng ');
  const parts = normalized.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={index} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part.replace(/[*_#`]/g, '');
      })}
    </>
  );
}

export default function AiPanel({
  onClose,
  width,
}: {
  onClose: () => void;
  width: number;
  maxWidth: number;
  onWidthChange: (width: number) => void;
}) {
  const panelInstanceId = useId();
  const ref = useRef<HTMLElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  const getActiveKey = useCallback(() => {
    const session = readSession();
    return getChatStorageKey(session?.user?.id);
  }, []);

  const [messages, setMessages] = useState<DisplayMessage[]>(() => {
    if (typeof window === 'undefined') return [getWelcomeMessage()];
    try {
      const session = readSession();
      const saved = localStorage.getItem(getChatStorageKey(session?.user?.id));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [getWelcomeMessage()];
  });

  // Lưu lịch sử chat vào localStorage mỗi khi có tin nhắn mới
  useEffect(() => {
    const key = getActiveKey();
    try {
      localStorage.setItem(key, JSON.stringify(messages));
    } catch {}
  }, [messages, getActiveKey]);

  // Đồng bộ lịch sử khi tài khoản đăng nhập/đăng xuất/chuyển đổi
  useEffect(() => {
    const onAuth = () => {
      const key = getActiveKey();
      try {
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
            return;
          }
        }
      } catch {}
      setMessages([getWelcomeMessage()]);
    };
    window.addEventListener(AUTH_EVENT, onAuth);
    return () => window.removeEventListener(AUTH_EVENT, onAuth);
  }, [getActiveKey]);

  const handleClearHistory = () => {
    const key = getActiveKey();
    const fresh = [getWelcomeMessage()];
    setMessages(fresh);
    try {
      localStorage.removeItem(key);
    } catch {}
  };

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
      id: `${panelInstanceId}-user-${messages.length}`,
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
        id: `${panelInstanceId}-assistant-${messages.length + 1}`,
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
        id: `${panelInstanceId}-error-${messages.length + 1}`,
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
      className="ai-panel flex h-full flex-col overflow-hidden bg-white text-ink"
    >
      {/* Header */}
      <header className="ai-panel-header flex shrink-0 items-center justify-between gap-3 border-b border-line bg-white px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div>
            <h2 id="ai-heading" className="text-base font-bold leading-5">Roomix AI</h2>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleClearHistory}
            title="Bắt đầu đoạn chat mới"
            aria-label="Bắt đầu đoạn chat mới"
            className="flex h-8 items-center gap-1 rounded-sm px-2.5 text-xs font-medium text-muted hover:bg-page hover:text-ink transition focus-visible:outline-2 focus-visible:outline-primary"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Chat mới</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng Roomix AI"
            className="flex h-8 w-8 items-center justify-center rounded-sm hover:bg-page transition text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-primary"
          >
            ✕
          </button>
        </div>
      </header>

      {/* Message List */}
      <div className="ai-messages min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`ai-message max-w-full px-3.5 py-3 text-sm leading-6 ${
                msg.role === 'user'
                  ? 'ai-message-user bg-primary-soft text-ink'
                  : 'ai-message-assistant bg-white text-ink'
              }`}
            >
              <div className="whitespace-pre-wrap break-words">{renderCleanContent(msg.content)}</div>

              {/* Matched Rooms List */}
              {msg.matchedRooms && msg.matchedRooms.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-line/50 pt-3">
                  <p className="text-xs font-semibold text-muted">
                    Phòng gợi ý phù hợp:
                  </p>
                  <div className="grid gap-2">
                    {msg.matchedRooms.map((room) => (
                      <Link
                        key={room.id}
                        href={`/rooms/${room.id}`}
                        onClick={onClose}
                        className="group block rounded-sm border border-line bg-page/50 p-3 transition hover:border-primary hover:bg-white"
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
              <div className="ai-followups mt-3 grid w-full gap-2">
                {msg.followUps.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={busy}
                    onClick={() => void handleSend(prompt)}
                    className="rounded-sm border border-line bg-white px-3 py-2.5 text-xs text-secondary transition hover:border-primary hover:text-primary hover:bg-primary-soft/30 text-left disabled:opacity-50"
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
      <footer className="ai-composer shrink-0 border-t border-line bg-white p-4">
        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
            placeholder="Hỏi về phòng, giá, tiền cọc, hợp đồng..."
            className="min-w-0 flex-1 rounded-sm border border-line bg-page px-3 py-3 text-sm text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-primary focus-visible:bg-white"
          />
          <Button className="shrink-0 rounded-sm" type="submit" size="sm" disabled={busy || !input.trim()}>
            Gửi
          </Button>
        </form>
      </footer>
    </aside>
  );
}
