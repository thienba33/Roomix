'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { OPEN_AI_EVENT } from '@/lib/tenant-store';
import { sendAiMessage, type AiMessage } from '@/services/ai';

interface AiState { open: boolean; draft: string; messages: AiMessage[]; roomId?: number; }
const initial: AiState = { open: false, draft: '', messages: [] };
const KEY = 'roomix:tenant:ai-session';
const AiContext = createContext<{
  state: AiState; update: (patch: Partial<AiState>) => void; ready: boolean;
  busy: boolean; error: string; send: (text: string, retry?: boolean) => Promise<void>; reset: () => void;
} | null>(null);
export default function AiProvider({ children }: { children: ReactNode; }) {
  const [state, setState] = useState<AiState>(initial);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const generation = useRef(0);
  const update = useCallback((patch: Partial<AiState>) => setState((s) => ({ ...s, ...patch })), []);
  const reset = useCallback(() => {
    generation.current += 1; inFlight.current = false;
    setBusy(false); setError(''); setState(initial);
    try { sessionStorage.removeItem(KEY); } catch { /* Optional storage. */ }
  }, []);
  const send = useCallback(async (raw: string, retry = false) => {
    const text = raw.trim();
    if (!text || inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    const requestGeneration = generation.current;
    const user: AiMessage = { id: crypto.randomUUID(), role: 'user', text };
    const history = retry ? state.messages : [...state.messages, user];
    setState((s) => ({ ...s, messages: history, draft: retry ? s.draft : '' }));
    try {
      const reply = await sendAiMessage(text, retry ? history.slice(0, -1) : state.messages, state.roomId);
      if (requestGeneration === generation.current) setState((s) => ({ ...s, messages: [...history, reply] }));
    } catch {
      if (requestGeneration === generation.current) setError('Chưa thể trả lời. Bạn thử gửi lại nhé.');
    } finally {
      if (requestGeneration === generation.current) { inFlight.current = false; setBusy(false); }
    }
  }, [state.messages, state.roomId]);
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = JSON.parse(sessionStorage.getItem(KEY) || 'null');
        if (saved && Array.isArray(saved.messages) && saved.messages.every((message: AiMessage) => message && typeof message.text === 'string' && typeof message.id === 'string' && ['user', 'ai'].includes(message.role)) && typeof saved.draft === 'string') {
          setState({ open: saved.open === true, draft: saved.draft, messages: saved.messages, roomId: typeof saved.roomId === 'number' ? saved.roomId : undefined });
          if (saved.messages.at(-1)?.role === 'user') setError('Lượt trả lời trước bị gián đoạn. Bạn có thể thử lại.');
        }
      } catch { /* Storage is optional. */ }
      setReady(true);
    });
    const open = (event: Event) => {
      const roomId = (event as CustomEvent<{ roomId?: number; }>).detail?.roomId;
      setState((s) => ({ ...s, open: true, ...(roomId !== undefined ? { roomId } : {}) }));
    };
    window.addEventListener(OPEN_AI_EVENT, open);
    return () => window.removeEventListener(OPEN_AI_EVENT, open);
  }, []);
  useEffect(() => { if (ready) { try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch { /* Keep working in memory. */ } } }, [state, ready]);
  return <AiContext.Provider value={{ state, ready, update, busy, error, send, reset }}>{children}</AiContext.Provider>;
}
export function useAi() { const context = useContext(AiContext); if (!context) throw new Error('AiProvider is required'); return context; }
export function openAi(context: { roomId?: number; } = {}) { window.dispatchEvent(new CustomEvent(OPEN_AI_EVENT, { detail: context })); }
