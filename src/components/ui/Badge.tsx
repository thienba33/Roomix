import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'green' | 'amber' | 'red' | 'indigo' | 'gray' | 'sky';

const tones: Record<Tone, string> = {
  green: 'bg-[#E6F4EA] text-ink',
  amber: 'bg-[#FEF3C7] text-ink',
  red: 'bg-[#FDE8E8] text-ink',
  indigo: 'bg-primary-soft text-primary-dark',
  gray: 'bg-[#F1F1F1] text-ink',
  sky: 'bg-sky-light text-sea-dark',
};
const dots: Record<Tone, string> = {
  green: 'bg-green-600', amber: 'bg-amber-600', red: 'bg-red-600',
  indigo: 'bg-primary', gray: 'bg-gray-500', sky: 'bg-sea',
};

export default function Badge({ tone = 'gray', dot = false, children, className }: { tone?: Tone; dot?: boolean; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone], className)}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dots[tone])} />}
      {children}
    </span>
  );
}
