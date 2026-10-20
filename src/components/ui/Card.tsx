import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props extends HTMLAttributes<HTMLDivElement> { children: ReactNode }

export default function Card({ className, children, ...rest }: Props) {
  return (
    <div className={cn('rounded-2xl border border-line bg-white', className)} {...rest}>
      {children}
    </div>
  );
}
