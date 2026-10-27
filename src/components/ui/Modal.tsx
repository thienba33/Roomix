'use client';
import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useDialogFocus } from '@/hooks/useDialogFocus';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  hideTitle?: boolean;
  children: ReactNode;
  widthClass?: string;
  contentClassName?: string;
}

export default function Modal({ open, onClose, title, hideTitle = false, children, widthClass = 'max-w-lg', contentClassName = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDialogFocus(ref, open, onClose);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} aria-label={title ? undefined : 'Thông tin'} tabIndex={-1} className={`relative w-full ${widthClass} max-h-[90vh] overflow-y-auto rounded-[20px] bg-white p-6 shadow-2xl ${contentClassName}`}>
        {title && (
          <div className={hideTitle ? 'absolute right-4 top-4 z-10' : 'mb-5 flex items-center justify-between'}>
            <h3 id={titleId} className={hideTitle ? 'sr-only' : 'text-[17px] font-bold text-ink'}>{title}</h3>
            <button onClick={onClose} aria-label="Đóng" className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-page hover:text-ink">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>, document.body
  );
}
