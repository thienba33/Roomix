'use client';

import { useState } from 'react';
import Image from 'next/image';
import Badge from '@/components/ui/Badge';
import { cn, postStatusLabel } from '@/lib/utils';
import type { PostStatus } from '@/types';

const tones = { DRAFT: 'gray', PENDING: 'amber', APPROVED: 'green', REJECTED: 'red', HIDDEN: 'gray' } as const;

export function ListingStatus({ status }: { status: PostStatus }) {
  return <Badge tone={tones[status]} dot>{postStatusLabel[status]}</Badge>;
}

export function ListingPhoto({ src, alt, className = '' }: { src?: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  return (
    <div className={cn('relative overflow-hidden bg-page', className)}>
      {src && src !== failed ? (
        <Image src={src} alt={alt} fill unoptimized className="object-cover" onError={() => setFailed(src)} />
      ) : (
        <div className="flex h-full min-h-20 flex-col items-center justify-center gap-2 px-2 text-muted">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8" cy="8" r="1.5" /><path d="m3 17 5-5 4 4 4-6 5 7" />
          </svg>
          <span className="text-center text-xs">{src ? 'Ảnh không khả dụng' : 'Chưa có ảnh'}</span>
        </div>
      )}
    </div>
  );
}

export function SubmissionChecklist({ requirements }: { requirements: { label: string; met: boolean }[] }) {
  return (
    <ul className="space-y-2.5 text-sm">
      {requirements.map(({ label, met }) => (
        <li key={label} className="flex items-start gap-2.5">
          <span className={cn('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px]', met ? 'bg-primary-soft text-primary' : 'border border-line text-muted')} aria-hidden="true">{met ? '✓' : '–'}</span>
          <span className={met ? 'text-secondary' : 'text-muted'}><span className="sr-only">{met ? 'Đã đủ: ' : 'Còn thiếu: '}</span>{label}</span>
        </li>
      ))}
    </ul>
  );
}
