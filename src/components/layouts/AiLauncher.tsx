'use client';

import ChatIcon from '@/components/ui/ChatIcon';
import { openAi, useAi } from './AiProvider';
import { cn } from '@/lib/utils';

export default function AiLauncher() {
  const { state, ready, update } = useAi();
  return (
    <button
      id="roomix-ai-launcher"
      type="button"
      disabled={!ready}
      onClick={() => state.open ? update({ open: false }) : openAi()}
      aria-label={state.open ? 'Đóng Roomix AI' : 'Mở Roomix AI'}
      title="Roomix AI"
      aria-controls="roomix-ai"
      aria-expanded={state.open}
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition hover:border-primary hover:text-primary focus-visible:outline-offset-4',
        state.open ? 'border-primary bg-primary-soft' : 'border-line bg-white text-secondary',
      )}
    >
      <ChatIcon size={21} />
    </button>
  );
}
