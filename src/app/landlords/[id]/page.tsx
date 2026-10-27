'use client';

import { use, useCallback } from 'react';
import Link from 'next/link';
import TenantShell from '@/components/layouts/TenantShell';
import Button from '@/components/ui/Button';
import { useApiData } from '@/hooks/useApiData';
import { profileInitials } from '@/lib/tenant-store';
import {
  getLandlordContact,
  PROFILE_EVENT,
  type LandlordContact,
} from '@/services/backend/auth';

export default function LandlordProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const loadProfile = useCallback(() => getLandlordContact(id), [id]);
  const {
    data: landlord,
    ready,
    error,
    retry,
  } = useApiData<LandlordContact | null>(
    `public-landlord:${id}`,
    loadProfile,
    null,
    PROFILE_EVENT,
  );

  if (!ready) {
    return (
      <TenantShell>
        <p role="status" className="mx-auto max-w-4xl px-4 py-12 text-muted">
          Đang tải hồ sơ chủ trọ…
        </p>
      </TenantShell>
    );
  }

  if (error || !landlord) {
    return (
      <TenantShell>
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-ink">Không thể mở hồ sơ chủ trọ</h1>
          <p role="alert" className="mt-3 text-sm text-muted">
            {error || 'Hồ sơ này không tồn tại hoặc chưa sẵn sàng.'}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {error && <Button onClick={retry}>Thử lại</Button>}
            <Link href="/" className="inline-flex items-center text-sm font-semibold text-primary">
              Về trang tìm phòng
            </Link>
          </div>
        </div>
      </TenantShell>
    );
  }

  const avatarStyle = landlord.avatarUrl
    ? { backgroundImage: `url(${JSON.stringify(landlord.avatarUrl)})` }
    : undefined;
  const zaloHref = landlord.zalo
    ? /^https?:\/\//i.test(landlord.zalo)
      ? landlord.zalo
      : `https://zalo.me/${landlord.zalo.replace(/\D/g, '') || encodeURIComponent(landlord.zalo)}`
    : '';

  return (
    <TenantShell>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <header className="rounded-2xl border border-line bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div
              role="img"
              aria-label={`Ảnh đại diện của ${landlord.fullName}`}
              style={avatarStyle}
              className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-primary-soft bg-cover bg-center text-2xl font-extrabold text-primary"
            >
              {!landlord.avatarUrl && profileInitials(landlord.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="break-words text-2xl font-extrabold text-ink">{landlord.fullName}</h1>
                <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                  Chủ trọ đã xác thực
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">
                Thành viên Roomix từ {new Date(landlord.joinedAt).toLocaleDateString('vi-VN')}.
                Thông tin liên hệ được cung cấp trực tiếp từ hồ sơ đã đăng ký.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 border-t border-line pt-6 sm:grid-cols-2">
            <a
              href={`tel:${landlord.phoneNumber.replace(/[^\d+]/g, '')}`}
              className="rounded-xl bg-page p-4 transition hover:bg-primary-soft"
            >
              <span className="block text-xs font-semibold uppercase tracking-wide text-muted">Điện thoại</span>
              <strong className="mt-1 block break-words text-primary">{landlord.phoneNumber}</strong>
            </a>
            {zaloHref ? (
              <a
                href={zaloHref}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-page p-4 transition hover:bg-primary-soft"
              >
                <span className="block text-xs font-semibold uppercase tracking-wide text-muted">Zalo</span>
                <strong className="mt-1 block break-words text-primary">{landlord.zalo}</strong>
              </a>
            ) : (
              <div className="rounded-xl bg-page p-4">
                <span className="block text-xs font-semibold uppercase tracking-wide text-muted">Zalo</span>
                <span className="mt-1 block text-sm text-muted">Chủ trọ chưa cập nhật</span>
              </div>
            )}
          </div>
        </header>

        <section className="space-y-4 rounded-2xl border border-line bg-white p-6">
          <h2 className="text-lg font-bold text-ink">Quy trình kết nối khách thuê và chủ trọ</h2>
          <div className="grid gap-4 text-sm sm:grid-cols-3">
            <div className="rounded-xl bg-page p-4">
              <span className="font-bold text-primary">1. Chọn phòng phù hợp</span>
              <p className="mt-1 text-xs leading-5 text-muted">
                Kiểm tra giá thuê, tiện ích và hình ảnh thực tế của phòng.
              </p>
            </div>
            <div className="rounded-xl bg-page p-4">
              <span className="font-bold text-primary">2. Gửi yêu cầu thuê</span>
              <p className="mt-1 text-xs leading-5 text-muted">
                Gửi lời nhắn để chủ trọ xem xét và phản hồi yêu cầu.
              </p>
            </div>
            <div className="rounded-xl bg-page p-4">
              <span className="font-bold text-primary">3. Liên hệ trực tiếp</span>
              <p className="mt-1 text-xs leading-5 text-muted">
                Sau khi được chấp nhận, sử dụng điện thoại hoặc Zalo để thống nhất nhận phòng.
              </p>
            </div>
          </div>
        </section>

        <div className="text-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover"
          >
            ← Khám phá phòng đang cho thuê
          </Link>
        </div>
      </div>
    </TenantShell>
  );
}
