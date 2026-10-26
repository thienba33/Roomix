'use client';
import { useEffect, useRef, useState } from 'react';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import ChatIcon from '@/components/ui/ChatIcon';
export default function AiPanel({ onClose, width }: {
  onClose: () => void; width: number; maxWidth: number; onWidthChange: (width: number) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const sync = () => setMobile(media.matches);
    sync(); media.addEventListener('change', sync);
    const escape = (event: KeyboardEvent) => { if (!media.matches && event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', escape);
    return () => { media.removeEventListener('change', sync); window.removeEventListener('keydown', escape); };
  }, [onClose]);
  useEffect(() => {
    if (window.matchMedia('(max-width: 767px)').matches) return;
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus({ preventScroll: true });
    return () => { if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, []);
  useDialogFocus(ref, mobile, onClose);
  return <aside id="roomix-ai" ref={ref} role={mobile ? 'dialog' : 'complementary'} aria-modal={mobile || undefined} aria-labelledby="ai-heading" tabIndex={-1} style={{ width: mobile ? undefined : width }} className="ai-panel flex flex-col bg-page text-ink shadow-[-8px_0_32px_-24px_rgba(34,34,34,0.3)]"><header className="flex items-center justify-between border-b border-line p-5"><h2 id="ai-heading" className="flex items-center gap-2 text-lg font-bold"><ChatIcon size={20} />Roomix AI</h2><button type="button" onClick={onClose} aria-label="Đóng Roomix AI" className="h-9 w-9 rounded-full hover:bg-white focus-visible:outline-2 focus-visible:outline-primary">✕</button></header><div className="flex flex-1 flex-col justify-center px-6 py-10"><h3 className="text-2xl font-bold tracking-tight">Tư vấn AI đang tạm dừng</h3><p role="status" className="mt-4 text-sm leading-7 text-muted">Roomix đang cập nhật tính năng tư vấn để bảo vệ thông tin liên hệ. Bạn vẫn có thể tìm phòng bằng khu vực, mức giá và tiện ích.</p><button onClick={onClose} className="mt-6 self-start rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white">Tiếp tục tìm phòng</button></div></aside>;
}
