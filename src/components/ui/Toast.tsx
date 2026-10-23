'use client';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

/** Optional action rendered as a button inside the toast (e.g. "Hoàn tác" / Undo). */
export interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastItem {
  id: number;
  title: string;
  body?: string;
  action?: ToastAction;
}

type PushFn = (title: string, body?: string, action?: ToastAction) => void;

const ToastCtx = createContext<{ push: PushFn }>({ push: () => {} });
export const useToast = () => useContext(ToastCtx);

const PLAIN_DURATION_MS = 3500;
/** Toasts carrying an action (e.g. Undo) stay longer so the user can act on them. */
const ACTION_DURATION_MS = 6000;

let seq = 0;
export function ToastProvider({ children, bottomOffset = 20 }: { children: ReactNode; bottomOffset?: number }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback<PushFn>(
    (title, body, action) => {
      const id = ++seq;
      setToasts((t) => [...t, { id, title, body, action }]);
      const timer = setTimeout(
        () => dismiss(id),
        action ? ACTION_DURATION_MS : PLAIN_DURATION_MS,
      );
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div style={{ bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom, 0px))` }} className="pointer-events-none fixed right-5 z-[100] flex w-[320px] flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto rounded-[20px] border border-line bg-white p-4 shadow-xl">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>
              </span>
              {t.title}
            </p>
            {t.body && <p className="mt-1 pl-7 text-[13px] text-muted">{t.body}</p>}
            {t.action && (
              <div className="mt-2 pl-7">
                <button
                  type="button"
                  onClick={() => {
                    t.action?.onClick();
                    dismiss(t.id);
                  }}
                  className="text-[13px] font-bold text-primary hover:text-primary-dark hover:underline"
                >
                  {t.action.label}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export default ToastProvider;
