'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import Image from 'next/image';

export default function RoomGallery({ images, title }: { images: string[]; title: string }) {
  const photos = images.filter((src) => src.trim());
  const viewport = useRef<HTMLDivElement>(null);
  const active = useRef(0);
  const drag = useRef<{ x: number; left: number } | null>(null);
  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [failed, setFailed] = useState<string[]>([]);
  const total = photos.length;

  // Keep the current photo in view when the page or chatbot sidebar is resized.
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      el.scrollTo({ left: active.current * el.clientWidth, behavior: 'instant' });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [total]);

  const go = (next: number) => {
    const el = viewport.current;
    if (!el) return;
    const target = Math.max(0, Math.min(total - 1, next));
    el.scrollTo({ left: target * el.clientWidth, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
    const el = event.currentTarget;
    if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId);
    go(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <section className="relative mt-6 overflow-hidden rounded-2xl bg-page" aria-label={`Ảnh phòng ${title}`}>
      <div
        ref={viewport}
        tabIndex={total > 1 ? 0 : undefined}
        aria-label={total > 1 ? 'Vuốt hoặc kéo ngang để xem ảnh; dùng phím mũi tên để chuyển ảnh' : undefined}
        className={`flex h-[clamp(220px,38vw,420px)] max-h-[55dvh] overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${dragging ? 'cursor-grabbing snap-none select-none' : `snap-x snap-mandatory ${total > 1 ? 'cursor-grab' : ''}`}`}
        onScroll={(event) => {
          const el = event.currentTarget;
          const next = Math.max(0, Math.min(total - 1, Math.round(el.scrollLeft / el.clientWidth)));
          active.current = next;
          setIndex(next);
        }}
        onKeyDown={(event) => {
          const next = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: total - 1 }[event.key];
          if (total > 1 && next !== undefined) { event.preventDefault(); go(next); }
        }}
        onPointerDown={(event) => {
          if (event.pointerType !== 'mouse' || event.button !== 0 || total < 2) return;
          event.preventDefault();
          event.currentTarget.focus({ preventScroll: true });
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { x: event.clientX, left: event.currentTarget.scrollLeft };
          setDragging(true);
        }}
        onPointerMove={(event) => {
          if (drag.current) event.currentTarget.scrollTo({ left: drag.current.left + drag.current.x - event.clientX, behavior: 'instant' });
        }}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onLostPointerCapture={() => { drag.current = null; setDragging(false); }}
      >
        {total ? photos.map((src, photoIndex) => (
          <div key={`${src}-${photoIndex}`} className="relative h-full w-full min-w-full snap-center snap-always" aria-hidden={photoIndex !== index}>
            {failed.includes(src) ? <div className="flex h-full items-center justify-center text-sm text-muted">Không tải được ảnh này. Hãy chuyển sang ảnh khác.</div> : <Image
              src={src}
              alt={`${title} — ảnh ${photoIndex + 1}`}
              fill
              sizes="(max-width: 1279px) 100vw, 1232px"
              className="pointer-events-none object-contain"
              draggable={false}
              priority={photoIndex === 0}
              onError={() => setFailed((current) => current.includes(src) ? current : [...current, src])}
            />}
          </div>
        )) : <p className="flex w-full items-center justify-center text-sm text-muted">Chưa có ảnh phòng</p>}
      </div>
      {total > 1 && <>
        <button type="button" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Ảnh trước" className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-ink shadow-sm disabled:pointer-events-none disabled:opacity-35">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg>
        </button>
        <button type="button" onClick={() => go(index + 1)} disabled={index === total - 1} aria-label="Ảnh tiếp theo" className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-ink shadow-sm disabled:pointer-events-none disabled:opacity-35">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg>
        </button>
        <span role="status" aria-live="polite" aria-label={`Ảnh ${index + 1} trên ${total}`} className="pointer-events-none absolute bottom-3 right-3 rounded-lg bg-black/65 px-3 py-1.5 text-xs font-semibold tabular-nums text-white">{index + 1} / {total}</span>
      </>}
    </section>
  );
}
