'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Modal from '@/components/ui/Modal';

// Replace null with Roomix's official profile URLs when they are available.
const SOCIALS: { name: string; href: string | null; icon: ReactNode }[] = [
  {
    name: 'Facebook',
    href: null,
    icon: <path fill="currentColor" stroke="none" d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.62.77-1.62 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12Z" />,
  },
  {
    name: 'X',
    href: null,
    icon: <path fill="currentColor" stroke="none" d="M18.9 2H22l-6.77 7.74L23.2 22h-6.24l-4.89-7.4L5.6 22H2.47l7.85-8.97L2 2h6.4l4.42 6.75L18.9 2ZM17.8 20h1.73L7.46 3.88H5.6L17.8 20Z" />,
  },
  {
    name: 'Instagram',
    href: null,
    icon: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></>,
  },
];

const POLICIES = {
  privacy: {
    title: 'Quyền riêng tư',
    content: <>
      <p>Roomix giúp bạn tìm phòng và quản lý thông tin thuê trọ.</p>
      <p>Thông tin tài khoản, phòng yêu thích và tùy chọn hiển thị hiện được lưu trên trình duyệt để bạn tiếp tục sử dụng khi tải lại trang.</p>
      <p>Bạn có thể xóa dữ liệu đã lưu trong phần cài đặt dữ liệu trang web của trình duyệt. Việc này sẽ đặt lại các tùy chọn trên thiết bị đó.</p>
    </>,
  },
  terms: {
    title: 'Điều khoản sử dụng',
    content: <>
      <p>Bạn có thể xem và tìm kiếm phòng mà không cần đăng nhập.</p>
      <p>Lưu phòng yêu thích và gửi yêu cầu thuê cần tài khoản khách thuê.</p>
      <p>Gửi yêu cầu thuê là bước bày tỏ nhu cầu. Bạn cần chờ chủ trọ phản hồi trước khi tiếp tục thỏa thuận thuê.</p>
    </>,
  },
};

export default function Footer() {
  const [policy, setPolicy] = useState<keyof typeof POLICIES | null>(null);

  return (
    <footer className="border-t border-line bg-page/50">
      <div className="w-full px-4 py-6 sm:px-6 lg:px-12">
        <div className="flex flex-col items-center justify-start gap-3 pb-5 sm:flex-row">
          <Link href="/" aria-label="Roomix — Trang chủ" className="rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
            <Image src="/images/logo.png" alt="Roomix" width={1970} height={680} className="h-7 w-auto" />
          </Link>
          <p className="text-center text-sm text-muted">Nền tảng thuê phòng trọ thông minh</p>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 pt-5 text-sm lg:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-ink">
            <span>© {new Date().getFullYear()} Roomix</span>
            <span aria-hidden="true" className="text-muted">·</span>
            <button type="button" onClick={() => setPolicy('privacy')} className="rounded hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">Quyền riêng tư</button>
            <span aria-hidden="true" className="text-muted">·</span>
            <button type="button" onClick={() => setPolicy('terms')} className="rounded hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">Điều khoản</button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
            <div className="flex items-center gap-1" role="group" aria-label="Mạng xã hội Roomix">
              {SOCIALS.map(({ name, href, icon }) => {
                const className = 'inline-flex h-9 w-9 items-center justify-center rounded-full text-ink transition hover:bg-primary-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-primary';
                const svg = <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">{icon}</svg>;
                return href ? (
                  <a key={name} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${name} của Roomix (mở tab mới)`} className={className}>{svg}</a>
                ) : (
                  <span key={name} aria-label={`${name}: sắp cập nhật`} title={`${name} của Roomix — Sắp cập nhật`} className="inline-flex h-9 w-9 items-center justify-center text-muted">{svg}</span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <Modal open={policy !== null} onClose={() => setPolicy(null)} title={policy ? POLICIES[policy].title : undefined}>
        {policy && <div className="space-y-4 text-sm leading-7 text-muted">{POLICIES[policy].content}</div>}
      </Modal>
    </footer>
  );
}
