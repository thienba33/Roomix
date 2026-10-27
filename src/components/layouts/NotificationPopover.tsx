'use client';
import { useRef, type RefObject } from 'react';
import Link from 'next/link';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import Notifications from '@/components/account/Notifications';
export default function NotificationPopover({ triggerRef, onClose }: { triggerRef: RefObject<HTMLButtonElement | null>; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogFocus(ref, true, () => { onClose(); triggerRef.current?.focus(); });
  return <div className="fixed inset-0 z-[60] bg-black/20" onClick={onClose}><div id="tenant-notifications" ref={ref} role="dialog" aria-modal="true" aria-label="Thông báo" tabIndex={-1} onClick={(event) => event.stopPropagation()} className="absolute right-4 top-20 max-h-[calc(100dvh-100px)] w-[min(520px,calc(100vw-32px))] overflow-y-auto rounded-2xl border border-line bg-white p-5 shadow-xl"><div className="mb-3 flex justify-end"><button aria-label="Đóng thông báo" onClick={onClose} className="h-9 w-9 rounded-full hover:bg-page">✕</button></div><Notifications /><Link href="/notifications" onClick={onClose} className="mt-5 block text-center text-sm font-semibold text-primary">Xem tất cả thông báo</Link></div></div>;
}
