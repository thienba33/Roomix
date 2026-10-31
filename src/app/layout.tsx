import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { headers } from 'next/headers';
import '@/styles/globals.css';
import AuthProvider from '@/components/auth/AuthProvider';
import AiProvider from '@/components/layouts/AiProvider';

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Roomix',
  description: 'Roomix — Nền tảng cho thuê phòng trọ thông minh: tìm phòng, quản lý nhà trọ, hóa đơn và chatbot AI.',
  icons: { icon: '/images/logo-mark.png' },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Nonces are unique per HTML request; keep rendering dynamic for Next's scripts.
  await headers();
  return (
    <html lang="vi" data-scroll-behavior="smooth" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white font-sans text-ink"><AiProvider><AuthProvider>{children}</AuthProvider></AiProvider></body>
    </html>
  );
}
