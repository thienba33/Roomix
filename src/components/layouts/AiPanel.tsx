'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ChatIcon from '@/components/ui/ChatIcon';
import { useRouter } from 'next/navigation';
import { rooms } from '@/lib/data';
import { formatPriceShort } from '@/lib/utils';
import { extractCriteria } from '@/services/ai';
import { useAi } from './AiProvider';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { AI_PANEL_DEFAULT, AI_PANEL_MIN } from '@/hooks/useAiPanelWidth';

const QUICK = ['Phòng dưới 3 triệu', 'Phòng ở Cầu Giấy', 'Phòng có ban công'];
export default function AiPanel({ onClose, width, maxWidth, onWidthChange }: {
  onClose: () => void;
  width: number;
  maxWidth: number;
  onWidthChange: (width: number) => void;
}) {
  const { state, update, busy, error, send } = useAi();
  const { messages, draft, roomId } = state;
  const [mobile, setMobile] = useState(false);
  const [newMessage, setNewMessage] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [resizeFocused, setResizeFocused] = useState(false);
  const drag = useRef<{ x: number; width: number } | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nearBottom = useRef(true);
  const router = useRouter();
  const close = useCallback(() => onClose(), [onClose]);
  useDialogFocus(panelRef, mobile, close);
  const room = rooms.find((item) => item.id === roomId);
  const latest = [...messages].reverse().find((message) => message.role === 'ai');
  const lastQuestion = [...messages].reverse().find((message) => message.role === 'user')?.text;
  const criteria = latest?.search ?? extractCriteria(lastQuestion || '');

  useEffect(() => {
    if (!resizing) return;
    const { cursor, userSelect } = document.body.style;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      document.body.style.cursor = cursor;
      document.body.style.userSelect = userSelect;
    };
  }, [resizing]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1279px)');
    const sync = () => setMobile(media.matches);
    sync(); media.addEventListener('change', sync);
    return () => { media.removeEventListener('change', sync); };
  }, []);
  useEffect(() => {
    const previous = (document.activeElement === document.body || panelRef.current?.contains(document.activeElement)
      ? document.getElementById('roomix-ai-launcher')
      : document.activeElement) as HTMLElement | null;
    const restoreFocus = () => requestAnimationFrame(() => {
      if (previous?.isConnected && document.activeElement === document.body) {
        previous.focus({ preventScroll: true });
      }
    });
    if (mobile) return () => { restoreFocus(); };
    textareaRef.current?.focus({ preventScroll: true });
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.querySelector('[aria-modal="true"]')) close();
    };
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('keydown', escape);
      // Restore focus after the panel has been removed.
      restoreFocus();
    };
  }, [mobile, close]);
  useEffect(() => {
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 112)}px`; }
  }, [draft]);
  useEffect(() => {
    if (nearBottom.current) { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); setNewMessage(false); }
    else setNewMessage(true);
  }, [messages, busy]);

  const applyCriteria = () => {
    // Only map criteria that the current catalogue can actually filter.
    const notes = [criteria.people ? `${criteria.people} người: cần xác nhận sức chứa` : '', criteria.nearSchool ? 'Gần Bách Khoa: cần xác nhận vị trí' : ''].filter(Boolean);
    try { localStorage.setItem('roomix_mock_room_search_v1', JSON.stringify({ location: criteria.area || '', maxPrice: criteria.maxPrice || undefined, amenities: criteria.amenities, sort: 'newest', page: 0, size: 16 })); } catch { /* Optional persistence. */ }
    try { sessionStorage.setItem('roomix:tenant:ai-search-notes', JSON.stringify(notes)); } catch { /* Optional persistence. */ }
    window.dispatchEvent(new CustomEvent('roomix:tenant:search-applied'));
    if (mobile) update({ open: false });
    router.push('/');
  };

  return <aside id="roomix-ai" ref={panelRef} role={mobile ? 'dialog' : 'complementary'} aria-modal={mobile || undefined} aria-labelledby="ai-heading" tabIndex={-1} style={{ width: mobile ? undefined : width }} className="ai-panel flex flex-col bg-page text-ink shadow-[-8px_0_32px_-24px_rgba(34,34,34,0.3)]">
    {!mobile && <div
      role="separator"
      aria-label="Điều chỉnh độ rộng chatbot"
      aria-orientation="vertical"
      aria-controls="roomix-ai"
      aria-valuemin={AI_PANEL_MIN}
      aria-valuemax={maxWidth}
      aria-valuenow={width}
      aria-valuetext={`${width} pixel`}
      tabIndex={0}
      title="Kéo để đổi độ rộng · Nhấp đúp để đặt lại"
      style={{ position: 'absolute', inset: '24px auto 24px -8px', width: 12, borderRadius: 99, zIndex: 2, cursor: 'col-resize', touchAction: 'none', outline: 'none', background: resizing ? 'rgba(79,70,229,0.12)' : undefined }}
      className="group flex items-center justify-center hover:bg-primary-soft/60 focus-visible:bg-primary-soft"
      onFocus={() => setResizeFocused(true)}
      onBlur={() => setResizeFocused(false)}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.currentTarget.focus();
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { x: event.clientX, width };
        setResizing(true);
      }}
      onPointerMove={(event) => {
        if (drag.current) onWidthChange(drag.current.width + drag.current.x - event.clientX);
      }}
      onPointerUp={(event) => {
        drag.current = null;
        setResizing(false);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onLostPointerCapture={() => { drag.current = null; setResizing(false); }}
      onDoubleClick={() => onWidthChange(AI_PANEL_DEFAULT)}
      onKeyDown={(event) => {
        const step = event.shiftKey ? 32 : 16;
        const values: Record<string, number> = { ArrowLeft: width + step, ArrowRight: width - step, Home: AI_PANEL_MIN, End: maxWidth };
        if (event.key in values) { event.preventDefault(); onWidthChange(values[event.key]); }
      }}
    ><span aria-hidden style={{ width: resizeFocused ? 4 : 3, height: 36, borderRadius: 99, background: resizing || resizeFocused ? 'var(--color-primary)' : 'var(--color-line)' }} /></div>}
    <div className="flex shrink-0 items-center justify-between gap-3 bg-white px-5 py-4 min-[1280px]:rounded-t-[24px]">
      <h2 id="ai-heading" className="text-sm font-semibold tracking-tight">Roomix AI</h2>
      <button type="button" onClick={close} aria-label={mobile ? 'Quay lại trang đang xem' : 'Đóng Roomix AI'} className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-page hover:text-ink">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d={mobile ? 'm14 6-6 6 6 6' : 'm6 6 12 12M6 18 18 6'} /></svg>
      </button>
    </div>
    {room && <div className="mx-4 mt-4 flex shrink-0 items-start gap-2 rounded-xl border border-primary/15 bg-white px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted">Đang hỏi về</p>
        <Link href={`/rooms/${room.id}`} onClick={() => { if (mobile) close(); }} className="text-sm font-semibold text-primary">{room.name}</Link>
      </div>
      <button onClick={() => update({ roomId: undefined })} aria-label="Bỏ ngữ cảnh phòng" className="h-8 w-8 rounded-full hover:bg-white">✕</button>
    </div>}
    <div ref={scrollRef} onScroll={(event) => { const el = event.currentTarget; nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; if (nearBottom.current) setNewMessage(false); }} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6">
      {messages.length === 0 && <div className="flex min-h-full flex-col justify-center pb-6">
        <h3 className="max-w-[13ch] text-[30px] font-extrabold leading-[1.3] tracking-[-1px]">Phòng phù hợp bắt đầu từ nhu cầu của bạn.</h3>
        <p className="mt-4 max-w-[36ch] text-sm leading-6 text-muted">Bạn muốn ở đâu, với ngân sách bao nhiêu? Cùng tìm một nơi phù hợp nhé.</p>
        <div className="mt-7 space-y-2.5">{QUICK.map((question) => <button key={question} disabled={busy} onClick={() => void send(question)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3.5 text-left text-sm text-secondary transition hover:border-primary hover:text-primary disabled:opacity-50">{question}<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
        </button>)}</div>
      </div>}
      <div role="log" aria-label="Hội thoại với Roomix AI" aria-live="polite" aria-relevant="additions" className="space-y-6">
        {messages.map((message) => <div key={message.id} className={message.role === 'user' ? 'ml-8 rounded-2xl rounded-br-md bg-primary px-4 py-3 text-white' : 'min-w-0'}>
          <p className={message.role === 'user' ? 'sr-only' : 'mb-2 flex items-center gap-2 text-xs font-semibold text-secondary'}>{message.role === 'ai' && <span className="text-primary"><ChatIcon size={15} /></span>}{message.role === 'user' ? 'Bạn' : 'Roomix AI'}</p>
          <p className="whitespace-pre-wrap break-words text-sm leading-7">{message.text}</p>
          {message.hits && <div className="mt-2 space-y-2">{message.hits.map(({ room: hit, reason }) => <Link key={hit.id} href={`/rooms/${hit.id}`} onClick={() => { if (mobile) close(); }} className="block overflow-hidden rounded-xl border border-line bg-white p-3 transition hover:border-primary/50">
            <div className="flex items-center gap-2.5">
              <Image src={hit.image} alt={hit.name} width={56} height={56} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold leading-5">{hit.name}</p>
                <p className="mt-0.5 text-sm font-bold text-primary">{formatPriceShort(hit.price)}/tháng</p>
                <p className="mt-0.5 text-xs text-muted">{hit.size} m² · {hit.area}</p>
              </div>
            </div>
            <p className="mt-1.5 break-words text-xs leading-5 text-muted">{reason}</p>
          </Link>)}</div>}
          {!!message.criteria?.length && <div className="mt-3 flex flex-wrap gap-1.5">{message.criteria.map((criterion) => <span key={criterion} className="rounded-md border border-line bg-white px-2 py-1 text-xs text-secondary">{criterion}</span>)}</div>}
          {!!message.sources?.length && <details className="mt-2 text-xs text-muted">
            <summary>Nguồn thông tin</summary>{message.sources.map((source) => <p key={source} className="mt-1 break-words">{source}</p>)}</details>}
        </div>)}
        {busy && <p role="status" className="flex items-center gap-2 text-sm text-muted"><span className="h-3 w-3 rounded-full border-2 border-primary/20 border-t-primary motion-safe:animate-spin" aria-hidden="true" />Đang tìm thông tin phù hợp…</p>}
      </div>
      {latest && !busy && <div className="mt-4 flex flex-wrap gap-1.5">{latest.followUps?.map((question) => <button key={question} onClick={() => void send(question)} className="rounded-full border border-line px-2.5 py-1.5 text-xs text-secondary hover:border-primary hover:text-primary">{question}</button>)}{criteria.chips.length > 0 && <button onClick={applyCriteria} className="rounded-full bg-primary-soft px-2.5 py-1.5 text-xs font-semibold text-primary">Áp dụng tiêu chí tìm phòng</button>}</div>}
      {error && <div role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}<button onClick={() => void send(lastQuestion || '', true)} className="ml-2 font-semibold underline">Thử lại</button>
      </div>}
    </div>
    {newMessage && <button onClick={() => { nearBottom.current = true; scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); setNewMessage(false); }} className="mx-auto mb-2 rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold shadow-sm">Tin nhắn mới ↓</button>}
    <div className="ai-composer shrink-0 bg-white px-4 pb-4 pt-3 min-[1280px]:rounded-b-[24px]">
      <form onSubmit={(event) => { event.preventDefault(); void send(draft); }} className="flex items-end gap-2 rounded-2xl border border-line bg-page p-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
        <textarea ref={textareaRef} value={draft} onChange={(event) => update({ draft: event.target.value })} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); void send(draft); } }} rows={1} aria-label="Nhắn cho Roomix AI" placeholder="Mô tả phòng bạn muốn tìm…" className="max-h-28 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 outline-none" />
        <button type="submit" disabled={!draft.trim() || busy} aria-label="Gửi tin nhắn" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m5 12 7-7 7 7M12 5v14" /></svg></button>
      </form>
      <p className="mt-2.5 text-center text-[11px] leading-4 text-muted">Enter để gửi, Shift + Enter để xuống dòng.</p>
    </div>
  </aside>;
}
