'use client';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import TenantShell from '@/components/layouts/TenantShell';
import Button from '@/components/ui/Button';

export default function TenantLayout({ children }: { children: ReactNode }) {
  const { user, ready, openAuth } = useAuth();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted">
        Đang tải thông tin tài khoản…
      </div>
    );
  }

  if (!user || user.role !== 'TENANT') {
    return (
      <main className="mx-auto max-w-lg space-y-4 px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-ink">Khu vực dành cho Khách thuê</h1>
        <p className="text-sm leading-6 text-muted">
          {user
            ? 'Tài khoản hiện tại của bạn không có quyền truy cập khu vực này.'
            : 'Vui lòng đăng nhập tài khoản khách thuê để quản lý phòng, yêu cầu thuê và hóa đơn.'}
        </p>
        <div className="flex justify-center gap-3 pt-2">
          {!user ? (
            <Button onClick={() => openAuth('login', 'tenant')}>Đăng nhập khách thuê</Button>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center rounded-xl border border-line px-4 py-2 text-sm font-semibold text-secondary hover:border-primary"
            >
              Về trang chủ
            </Link>
          )}
        </div>
      </main>
    );
  }

  return <TenantShell>{children}</TenantShell>;
}

