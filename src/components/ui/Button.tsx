import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-dark shadow-sm',
  outline: 'border border-line bg-white text-ink hover:border-primary hover:text-primary',
  ghost: 'text-muted hover:text-ink hover:bg-page',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
};
const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[13px]',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3.5 text-[15px]',
};

export default function Button({ variant = 'primary', size = 'md', className, children, ...rest }: Props) {
  return (
    <button className={cn('inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:opacity-50 disabled:pointer-events-none', variants[variant], sizes[size], className)} {...rest}>
      {children}
    </button>
  );
}
