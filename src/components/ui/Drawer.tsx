'use client';
import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useDialogFocus } from '@/hooks/useDialogFocus';

interface Props { open: boolean; onClose: () => void; title?: string; children: ReactNode }

export default function Drawer({ open, onClose, title, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDialogFocus(ref, open, onClose);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <aside ref={ref} role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} aria-label={title ? undefined : 'Thông tin'} tabIndex={-1} className="absolute right-0 top-0 flex h-dvh w-full max-w-[440px] flex-col bg-white shadow-2xl">
        {title && (
          <div className="flex items-center justify-between border-b border-line px-6 py-5">
            <h3 id={titleId} className="text-[17px] font-bold text-ink">{title}</h3>
            <button onClick={onClose} aria-label="Đóng" className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-page hover:text-ink">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </aside>
    </div>, document.body
  );
}
