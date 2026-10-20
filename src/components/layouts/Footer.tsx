import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-6 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2">
          <Image src="/images/logo.png" alt="Roomix" width={1961} height={680} className="h-5 w-auto" />
          <p className="text-sm text-muted">Roomix — Nền tảng cho thuê phòng trọ thông minh</p>
        </div>
        <nav className="flex gap-5 text-[13px] text-muted">
          <Link href="/" className="hover:text-ink">Tìm phòng</Link>
          <Link href="/favorites" className="hover:text-ink">Phòng yêu thích</Link>
          <Link href="/landlord" className="hover:text-ink">Dành cho chủ trọ</Link>
        </nav>
      </div>
    </footer>
  );
}
