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
        className="group relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-primary-hover text-white shadow-2xl shadow-primary/40 ring-4 ring-white/90 transition-all duration-300 hover:scale-110 hover:shadow-primary/60 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/50"
      >
        <ChatIcon size={28} className="drop-shadow transition-transform duration-300 group-hover:scale-110" />

        {/* Pulse indicator beacon */}
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
        </span>

        {/* Hover Tooltip */}
        <span className="pointer-events-none absolute right-full mr-3.5 hidden whitespace-nowrap rounded-2xl bg-ink/90 px-3.5 py-2 text-xs font-semibold text-white shadow-xl backdrop-blur transition-all duration-200 sm:block opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0">
          Tư vấn cùng Roomix AI ✨
        </span>
      </button>
    </div>
  );
}
