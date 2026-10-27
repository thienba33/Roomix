'use client';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { OPEN_AI_EVENT } from '@/lib/tenant-store';
import { AUTH_EVENT } from '@/services/backend/session';
const AiContext = createContext<{
  state: { open: boolean }; ready: boolean;
  update: (patch: { open: boolean }) => void; reset: () => void;
} | null>(null);
// Chat remains locked until the RAG backend enforces the contact access rule.
export default function AiProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({ open: false });
  const update = useCallback((patch: { open: boolean }) => setState(patch), []);
  const reset = useCallback(() => setState({ open: false }), []);
  useEffect(() => {
    const open = () => setState({ open: true });
    window.addEventListener(OPEN_AI_EVENT, open);
    window.addEventListener(AUTH_EVENT, reset);
    return () => { window.removeEventListener(OPEN_AI_EVENT, open); window.removeEventListener(AUTH_EVENT, reset); };
  }, [reset]);
  return <AiContext.Provider value={{ state, ready: true, update, reset }}>{children}</AiContext.Provider>;
}
export function useAi() { const context = useContext(AiContext); if (!context) throw new Error('AiProvider is required'); return context; }
export function openAi() { window.dispatchEvent(new Event(OPEN_AI_EVENT)); }
