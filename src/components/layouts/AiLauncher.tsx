'use client';

import ChatIcon from '@/components/ui/ChatIcon';
import { openAi, useAi } from './AiProvider';
import { cn } from '@/lib/utils';

export default function AiLauncher({ className }: { className?: string }) {
  const { state, ready, update } = useAi();

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-40 transition-all duration-300 ease-in-out',
        state.open ? 'pointer-events-none scale-0 opacity-0' : 'scale-100 opacity-100',
        className,
      )}
    >
      <button
        id="roomix-ai-launcher"
        type="button"
        disabled={!ready}
        onClick={() => (state.open ? update({ open: false }) : openAi())}
        aria-label={state.open ? 'Đóng Roomix AI' : 'Mở Roomix AI'}
        title="Roomix AI"
        aria-controls="roomix-ai"
        aria-expanded={state.open}
        className="group relative flex h-12 w-12 items-center justify-center rounded-md border border-primary bg-primary text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-50"
      >
        <ChatIcon size={24} />
        <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-sm bg-ink px-3 py-2 text-xs text-white opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 sm:block">Roomix AI</span>
      </button>
    </div>
  );
}
