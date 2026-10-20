import Link from 'next/link';
import TenantShell from '@/components/layouts/TenantShell';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';

export default function StatesPage() {
  return (
    <TenantShell>
      <div className="w-full px-6 py-6 lg:px-12">
        <h1 className="text-[28px] font-extrabold text-ink">Trạng thái giao diện</h1>
        <p className="mt-1 text-sm text-muted">Các trạng thái trống và đang tải dùng trong Roomix</p>

        <h2 className="mt-10 text-base font-bold text-ink">Trạng thái trống — Chưa có phòng yêu thích</h2>
        <Card className="mt-3 border-dashed p-10 text-center shadow-none">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-page text-muted">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
          </span>
          <p className="mt-4 text-lg font-bold text-ink">Chưa có phòng yêu thích</p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted">
            Nhấn vào biểu tượng trái tim ở mỗi phòng để lưu lại và so sánh sau.
          </p>
          <Link href="/" className="mt-5 inline-block">
            <Button>Khám phá phòng</Button>
          </Link>
        </Card>

        <h2 className="mt-12 text-base font-bold text-ink">Đang tải — Danh sách phòng</h2>
        <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3" aria-label="Đang tải">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </TenantShell>
  );
}
