import Link from 'next/link';
import TenantShell from '@/components/layouts/TenantShell';
import Button from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';

export default function StatesPage() {
  return (
    <TenantShell>
      <div className="w-full px-6 py-6 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* LEFT — Empty state */}
          <div className="relative min-h-[560px] rounded-2xl border border-line bg-white p-6">
            <span className="absolute left-6 top-6 text-[13px] text-muted">Trạng thái trống (Empty state)</span>
            <div className="flex h-full flex-col items-center justify-center py-20 text-center">
              <svg width="76" height="76" viewBox="0 0 24 24" fill="none" stroke="#DDDDDD" strokeWidth="1.2" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
              <p className="mt-6 text-[17px] font-semibold text-ink">Chưa có phòng yêu thích</p>
              <p className="mt-2 text-sm text-muted">Nhấn ♡ ở phòng bạn thích để lưu lại.</p>
              <Link href="/" className="mt-6 inline-block">
                <Button>Khám phá phòng</Button>
              </Link>
            </div>
          </div>

          {/* RIGHT — Loading skeleton */}
          <div className="relative min-h-[560px] rounded-2xl border border-line bg-white p-6">
            <span className="absolute left-6 top-6 text-[13px] text-muted">Đang tải…</span>
            <div className="mt-10 grid grid-cols-2 gap-6" aria-label="Đang tải">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <span className="absolute bottom-6 left-6 text-[13px] text-muted">Đang tải danh sách (Skeleton)</span>
          </div>
        </div>
      </div>
    </TenantShell>
  );
}
