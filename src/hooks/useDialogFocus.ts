'use client';
import { useEffect, useEffectEvent, type RefObject } from 'react';

// Only the topmost dialog handles Tab/Escape. Releasing a nested dialog restores its trigger.
const stack: HTMLElement[] = [];
let locks = 0;
let previousOverflow = '';
export function useDialogFocus(ref: RefObject<HTMLElement | null>, active: boolean, onClose: () => void) {
  const close = useEffectEvent(onClose);
  useEffect(() => {
    const element = ref.current;
    if (!active || !element) return;
    const previous = document.activeElement as HTMLElement | null;
    stack.push(element);
    if (locks++ === 0) { previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
    const focusable = () => Array.from(element.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]')).filter((item) => item.getClientRects().length > 0);
    (focusable()[0] || element).focus();
    const handler = (event: KeyboardEvent) => {
      if (stack.at(-1) !== element) return;
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); close(); }
      if (event.key === 'Tab') {
        const items = focusable();
        const first = items[0]; const last = items.at(-1);
        if (!first) { event.preventDefault(); element.focus(); }
        else if (event.shiftKey && (document.activeElement === first || !element.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !element.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => {
      stack.splice(stack.indexOf(element), 1);
      if (--locks === 0) document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handler, true);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [ref, active]);
}
