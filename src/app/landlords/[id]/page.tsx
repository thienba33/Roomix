'use client';

import { use } from 'react';
import Link from 'next/link';
import TenantShell from '@/components/layouts/TenantShell';
import Button from '@/components/ui/Button';

export default function LandlordProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <TenantShell>
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <header className="rounded-2xl border border-line bg-white p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
              🏡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-ink">Chủ trọ Roomix</h1>
                <span className="rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                  Đã xác thực
                </span>
              </div>
              <p className="mt-1 text-xs text-muted font-mono">Mã đối tác: {id}</p>
              <p className="mt-2 text-sm text-secondary">
                Đối tác cho thuê phòng trọ chính thức trên hệ thống Roomix. Đảm bảo quy chế hợp đồng và minh bạch chỉ số điện nước.
              </p>
            </div>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm">
              Tìm các phòng khác
            </Button>
          </Link>
        </header>

        <section className="rounded-2xl border border-line bg-white p-6 space-y-4">
          <h2 className="text-lg font-bold text-ink">Quy trình kết nối khách thuê &amp; chủ trọ</h2>
          <div className="grid gap-4 sm:grid-cols-3 text-sm">
            <div className="rounded-xl bg-page p-4">
              <span className="font-bold text-primary">1. Chọn phòng ưng ý</span>
              <p className="mt-1 text-xs text-muted">Xem chi tiết phòng, giá thuê, tiện ích và hình ảnh thực tế được đăng tải.</p>
            </div>
            <div className="rounded-xl bg-page p-4">
              <span className="font-bold text-primary">2. Gửi yêu cầu quan tâm</span>
              <p className="mt-1 text-xs text-muted">Nhấn nút &quot;Quan tâm phòng&quot; và để lại lời nhắn để chủ trọ tiếp nhận.</p>
            </div>
            <div className="rounded-xl bg-page p-4">
              <span className="font-bold text-primary">3. Nhận danh thiếp &amp; cọc</span>
              <p className="mt-1 text-xs text-muted">Khi chủ trọ chấp nhận, bạn sẽ nhận Danh thiếp liên hệ trực tiếp và hợp đồng thuê.</p>
            </div>
          </div>
        </section>

        <div className="text-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover"
          >
            ← Khám phá danh sách phòng đang mở cho thuê
          </Link>
        </div>
      </div>
    </TenantShell>
  );
}
