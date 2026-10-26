import Image from 'next/image';
import type { ReactNode } from 'react';

export default function AuthScene({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-w-0 md:min-h-[580px] md:grid-cols-[.9fr_1.1fr]">
      <aside style={{ position: 'relative' }} className="isolate hidden overflow-hidden rounded-l-[24px] bg-slate-200 md:block" aria-label="Không gian sống tại Roomix">
        <Image src="/images/rooms/room-302-a.jpg" alt="Phòng ngủ sáng với cửa sổ lớn" fill sizes="420px" className="object-cover" />
        <div className="relative z-[1] flex h-full min-h-[580px] flex-col justify-end bg-gradient-to-t from-slate-900/90 to-transparent p-9 text-white">
          <h2 className="mt-5 text-4xl font-bold leading-[1.3] tracking-[-1.5px]">Một nơi ở.<br />Nhiều khởi đầu.</h2>
          <p className="mt-4 max-w-[28ch] text-sm leading-7 text-slate-200">Tìm phòng cho bạn, quản lý nhà trọ của bạn. Bắt đầu cùng Roomix.</p>
        </div>
      </aside>
      <div className="relative min-w-0 self-center bg-white px-5 pb-6 pt-10 sm:px-6 md:px-9 md:pb-8">{children}</div>
    </div>
  );
}
