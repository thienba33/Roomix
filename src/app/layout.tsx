import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import '@/styles/globals.css';

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Roomix — Cho thuê phòng trọ thông minh',
  description: 'Roomix — Nền tảng cho thuê phòng trọ thông minh: tìm phòng, quản lý nhà trọ, hóa đơn và chatbot AI.',
  icons: { icon: '/images/logo-mark.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white font-sans text-ink">{children}</body>
    </html>
  );
}
