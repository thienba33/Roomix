'use client';
import Button from '@/components/ui/Button';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-extrabold text-ink">Đã có lỗi xảy ra</h1>
      <p className="max-w-md text-sm text-muted">Trang chưa tải được. Bạn thử lại sau ít phút nhé.</p>
      <Button onClick={() => reset()}>Thử lại</Button>
    </div>
  );
}
