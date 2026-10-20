import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-5xl font-extrabold text-primary">404</p>
      <h1 className="text-2xl font-extrabold text-ink">Không tìm thấy trang</h1>
      <p className="max-w-md text-sm text-muted">Trang bạn tìm không tồn tại hoặc đã được di chuyển.</p>
      <Link href="/"><Button>Về trang chủ</Button></Link>
    </div>
  );
}
