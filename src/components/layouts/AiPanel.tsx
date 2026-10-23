'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
  const { state, update, busy, error, send, reset } = useAi();
  const { messages, draft, roomId } = state;
  const [confirmReset, setConfirmReset] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [newMessage, setNewMessage] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [resizeFocused, setResizeFocused] = useState(false);
  const drag = useRef<{ x: number; width: number } | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const resetRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nearBottom = useRef(true);
  const router = useRouter();
  const close = useCallback(() => onClose(), [onClose]);
  const closeReset = useCallback(() => setConfirmReset(false), []);
  useDialogFocus(panelRef, mobile, close);
  useDialogFocus(resetRef, confirmReset, closeReset);
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
    try { localStorage.setItem('roomix_mock_room_search_v1', JSON.stringify({ location: criteria.area || '', maxPrice: criteria.maxPrice || undefined, amenities: criteria.amenities, sort: 'newest', page: 0, size: 2 })); } catch { /* Optional persistence. */ }
    try { sessionStorage.setItem('roomix:tenant:ai-search-notes', JSON.stringify(notes)); } catch { /* Optional persistence. */ }
    window.dispatchEvent(new CustomEvent('roomix:tenant:search-applied'));
    if (mobile) update({ open: false });
    router.push('/');
  };

  return <aside id="roomix-ai" ref={panelRef} role={mobile ? 'dialog' : 'complementary'} aria-modal={mobile || undefined} aria-labelledby="ai-heading" tabIndex={-1} style={{ width: mobile ? undefined : width }} className="ai-panel flex flex-col bg-white">
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
      style={{ position: 'absolute', inset: '0 auto 0 -5px', width: 10, zIndex: 2, cursor: 'col-resize', touchAction: 'none', outline: 'none', background: resizing ? 'rgba(79,70,229,0.12)' : undefined }}
      className="group flex items-center justify-center hover:bg-primary-soft focus-visible:bg-primary-soft"
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
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-4 py-3">
      <div>
        <h2 id="ai-heading" className="text-base font-bold">Roomix AI</h2>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => setConfirmReset(true)} disabled={busy || (!messages.length && !draft)} aria-label="Trò chuyện mới" title="Trò chuyện mới" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-page disabled:opacity-40"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg></button>
        <button onClick={close} aria-label={mobile ? 'Quay lại trang đang xem' : 'Đóng Roomix AI'} className="flex h-8 w-8 items-center justify-center rounded-lg text-secondary hover:bg-page">{mobile ? '←' : '✕'}</button>
      </div>
    </div>
    {room && <div className="flex shrink-0 items-start gap-2 border-b border-line bg-primary-soft/50 px-5 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted">Đang hỏi về</p>
        <Link href={`/rooms/${room.id}`} onClick={() => { if (mobile) close(); }} className="text-sm font-semibold text-primary">{room.name}</Link>
      </div>
      <button onClick={() => update({ roomId: undefined })} aria-label="Bỏ ngữ cảnh phòng" className="h-8 w-8 rounded-full hover:bg-white">✕</button>
    </div>}
    <div ref={scrollRef} onScroll={(event) => { const el = event.currentTarget; nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; if (nearBottom.current) setNewMessage(false); }} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
      {messages.length === 0 && <div className="flex min-h-full flex-col justify-center pb-8">
        <h3 className="text-2xl font-bold leading-tight tracking-tight">Bạn đang tìm phòng<br />như thế nào?</h3>
        <p className="mt-3 text-sm leading-6 text-muted">Cho mình biết ngân sách, khu vực hoặc tiện ích bạn cần để bắt đầu.</p>
        <div className="mt-6 space-y-2">{QUICK.map((question) => <button key={question} disabled={busy} onClick={() => void send(question)} className="flex w-full items-center justify-between rounded-xl border border-line px-4 py-3 text-left text-sm text-secondary transition hover:border-primary hover:bg-primary-soft/40">{question}<span aria-hidden className="text-primary">↗</span>
        </button>)}</div>
      </div>}
      <div role="log" aria-label="Hội thoại với Roomix AI" aria-live="polite" aria-relevant="additions" className="space-y-4">
        {messages.map((message) => <div key={message.id} className={message.role === 'user' ? 'ml-10 rounded-2xl rounded-br-sm bg-primary-soft px-3 py-2.5' : ''}>
          <p className={message.role === 'user' ? 'sr-only' : 'mb-1 text-[11px] font-semibold text-muted'}>{message.role === 'user' ? 'Bạn' : 'Roomix AI'}</p>
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">{message.text}</p>
          {message.hits && <div className="mt-2 space-y-2">{message.hits.map(({ room: hit, reason }) => <Link key={hit.id} href={`/rooms/${hit.id}`} onClick={() => { if (mobile) close(); }} className="block rounded-xl border border-line p-2.5 transition hover:border-primary/50 hover:bg-page">
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
          {!!message.criteria?.length && <div className="mt-3 flex flex-wrap gap-1.5">{message.criteria.map((criterion) => <span key={criterion} className="rounded-md bg-page px-2 py-1 text-xs text-secondary">{criterion}</span>)}</div>}
          {!!message.sources?.length && <details className="mt-2 text-xs text-muted">
            <summary>Nguồn thông tin</summary>{message.sources.map((source) => <p key={source} className="mt-1 break-words">{source}</p>)}</details>}
        </div>)}
        {busy && <p role="status" className="text-sm text-muted">Đang tìm thông tin phù hợp…</p>}
      </div>
      {latest && !busy && <div className="mt-4 flex flex-wrap gap-1.5">{latest.followUps?.map((question) => <button key={question} onClick={() => void send(question)} className="rounded-full border border-line px-2.5 py-1.5 text-xs text-secondary hover:border-primary hover:text-primary">{question}</button>)}{criteria.chips.length > 0 && <button onClick={applyCriteria} className="rounded-full bg-primary-soft px-2.5 py-1.5 text-xs font-semibold text-primary">Áp dụng tiêu chí vào danh sách ↗</button>}</div>}
      {error && <div role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}<button onClick={() => void send(lastQuestion || '', true)} className="ml-2 font-semibold underline">Thử lại</button>
      </div>}
    </div>
    {newMessage && <button onClick={() => { nearBottom.current = true; scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); setNewMessage(false); }} className="mx-auto mb-2 rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold shadow-sm">Tin nhắn mới ↓</button>}
    <div className="ai-composer shrink-0 border-t border-line px-3 py-3">
      <form onSubmit={(event) => { event.preventDefault(); void send(draft); }} className="flex items-end gap-2 rounded-xl border border-line bg-white p-1.5 focus-within:border-primary">
        <textarea ref={textareaRef} value={draft} onChange={(event) => update({ draft: event.target.value })} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); void send(draft); } }} rows={1} aria-label="Nhắn cho Roomix AI" placeholder="Mô tả phòng bạn muốn tìm…" className="max-h-28 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 outline-none" />
        <button type="submit" disabled={!draft.trim() || busy} aria-label="Gửi tin nhắn" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m5 12 7-7 7 7M12 5v14" /></svg></button>
      </form>
    </div>
    {confirmReset && <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 p-5">
      <div ref={resetRef} role="dialog" aria-modal="true" aria-labelledby="reset-heading" tabIndex={-1} className="w-full rounded-2xl bg-white p-5 shadow-xl">
        <h3 id="reset-heading" className="font-bold">Bắt đầu cuộc trò chuyện mới?</h3>
        <p className="mt-2 text-sm text-muted">Hội thoại và bản nháp hiện tại sẽ được xóa.</p>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={closeReset} className="rounded-xl border border-line px-4 py-2 text-sm">Giữ lại</button>
          <button onClick={() => { reset(); update({ open: true }); closeReset(); }} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">Bắt đầu mới</button>
        </div>
      </div>
    </div>}
  </aside>;
}
