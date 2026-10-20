'use client';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

interface ToastItem { id: number; title: string; body?: string }
const ToastCtx = createContext<{ push: (title: string, body?: string) => void }>({ push: () => {} });
export const useToast = () => useContext(ToastCtx);

let seq = 0;
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const push = useCallback((title: string, body?: string) => {
    const id = ++seq;
    setToasts((t) => [...t, { id, title, body }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[320px] flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto rounded-2xl border border-line bg-white p-4 shadow-xl">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>
              </span>
              {t.title}
            </p>
            {t.body && <p className="mt-1 pl-7 text-[13px] text-muted">{t.body}</p>}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export default ToastProvider;
