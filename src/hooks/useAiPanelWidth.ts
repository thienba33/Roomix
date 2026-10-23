'use client';

import { useCallback, useEffect, useState } from 'react';

export const AI_PANEL_MIN = 360;
export const AI_PANEL_DEFAULT = 400;
const KEY = 'roomix:tenant:ai-panel-width';
const limit = () => Math.max(AI_PANEL_MIN, Math.min(600, window.innerWidth - 720));

export function useAiPanelWidth() {
  const [width, setWidth] = useState(AI_PANEL_DEFAULT);
  const [maxWidth, setMaxWidth] = useState(600);
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    let preferred = AI_PANEL_DEFAULT;
    try {
      const saved = Number(localStorage.getItem(KEY));
      if (Number.isFinite(saved) && saved >= AI_PANEL_MIN) preferred = saved;
    } catch { /* Optional storage. */ }
    const sync = () => {
      const max = limit();
      setDesktop(window.innerWidth >= 1280);
      setMaxWidth(max);
      setWidth((current) => Math.max(AI_PANEL_MIN, Math.min(current, max)));
    };
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setWidth(Math.max(AI_PANEL_MIN, Math.min(preferred, limit())));
      sync();
    });
    window.addEventListener('resize', sync);
    return () => { active = false; window.removeEventListener('resize', sync); };
  }, []);
  const resize = useCallback((value: number) => {
    const next = Math.round(Math.max(AI_PANEL_MIN, Math.min(value, limit())));
    setWidth(next);
    try { localStorage.setItem(KEY, String(next)); } catch { /* Optional storage. */ }
  }, []);
  return { width, maxWidth, desktop, resize };
}
