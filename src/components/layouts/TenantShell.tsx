'use client';
import { useCallback, useEffect, type ReactNode } from 'react';
import TenantHeader from './TenantHeader';
import AiPanel from './AiPanel';
import AiLauncher from './AiLauncher';
import { useAi } from './AiProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { useAiPanelWidth } from '@/hooks/useAiPanelWidth';

export default function TenantShell({ children, defaultAiOpen = false }: { children: ReactNode; defaultAiOpen?: boolean; }) {
  const { state, ready, update } = useAi();
  const { width, maxWidth, desktop, resize } = useAiPanelWidth();
  const closeAi = useCallback(() => update({ open: false }), [update]);
  useEffect(() => { if (ready && defaultAiOpen) update({ open: true }); }, [ready, defaultAiOpen, update]);
  return <ToastProvider>
    <div className="tenant-shell flex min-h-screen flex-col bg-white lg:flex-row">
      <TenantHeader />
      <div className={`tenant-workspace flex min-w-0 flex-1 ${state.open ? 'ai-is-open' : ''}`}>
        <div className="tenant-content flex min-w-0 flex-1 flex-col" style={{ marginRight: desktop && state.open ? width + 24 : 0 }}>
          <main className="flex-1">{children}</main>
        </div>
        {state.open && <AiPanel onClose={closeAi} width={width} maxWidth={maxWidth} onWidthChange={resize} />}
      </div>
      <AiLauncher />
    </div>
  </ToastProvider>;
}
