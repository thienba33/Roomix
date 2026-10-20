import { type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
}

export default function Input({ label, icon, className, id, ...rest }: Props) {
  const inputId = id ?? rest.name;
  return (
    <div className="w-full">
      {label && <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-semibold text-ink">{label}</label>}
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">{icon}</span>}
        <input
          id={inputId}
          className={cn('w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink placeholder:text-muted outline-none transition focus:border-ink focus:ring-1 focus:ring-ink/15', icon ? 'pl-11' : '', className)}
          {...rest}
        />
      </div>
    </div>
  );
}
