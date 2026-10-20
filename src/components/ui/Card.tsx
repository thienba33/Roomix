import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props extends HTMLAttributes<HTMLDivElement> { children: ReactNode }

export default function Card({ className, children, ...rest }: Props) {
  return (
    <div className={cn('rounded-2xl border border-line bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]', className)} {...rest}>
      {children}
    </div>
  );
}
