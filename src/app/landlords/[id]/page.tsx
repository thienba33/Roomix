'use client';

import { use, useCallback, type ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import AdminSidebar from '@/components/layouts/AdminSidebar';
import HostSidebar from '@/components/layouts/HostSidebar';
import TenantShell from '@/components/layouts/TenantShell';
import Button from '@/components/ui/Button';
import { ToastProvider } from '@/components/ui/Toast';
import { useApiData } from '@/hooks/useApiData';
import { profileInitials } from '@/lib/tenant-store';
import { getLandlordContact, PROFILE_EVENT, type LandlordContact } from '@/services/backend/auth';

function ProfileShell({ children }: { children: ReactNode }) {
  const { ready, user } = useAuth();
  if (!ready) return <p role="status" className="p-8 text-muted">Đang tải tài khoản…</p>;
  if (user?.role !== 'LANDLORD' && user?.role !== 'ADMIN') return <TenantShell>{children}</TenantShell>;

  return (
    <ToastProvider>
      <div className={`${user.role === 'LANDLORD' ? 'host-shell' : 'admin-shell'} flex min-h-screen bg-white`}>
        {user.role === 'LANDLORD' ? <HostSidebar /> : <AdminSidebar />}
        <main className="mx-auto w-full min-w-0 max-w-[1600px] flex-1 px-4 pb-8 pt-[88px] sm:px-6 lg:pt-8">{children}</main>
      </div>
    </ToastProvider>
  );
}

export default function LandlordProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const loadProfile = useCallback(() => getLandlordContact(id), [id]);
  const { data: landlord, ready, error, retry } = useApiData<LandlordContact | null>(
    `public-landlord:${id}`, loadProfile, null, PROFILE_EVENT,
  );
  const ownProfile = user?.role === 'LANDLORD' && user.id === id;
  const backHref = user?.role === 'LANDLORD' ? '/landlord' : user?.role === 'ADMIN' ? '/admin' : '/';
  const backLabel = user?.role === 'LANDLORD' ? 'Về trang quản lý' : user?.role === 'ADMIN' ? 'Về trang quản trị' : 'Tìm phòng';

  if (!ready) return <ProfileShell><p role="status" className="mx-auto max-w-5xl px-4 py-12 text-muted">Đang tải hồ sơ…</p></ProfileShell>;
  if (error || !landlord) return (
    <ProfileShell>
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-2xl font-bold text-ink">Không thể mở hồ sơ chủ trọ</h1>
        <p role="alert" className="mt-3 text-sm text-muted">{error || 'Hồ sơ này không tồn tại hoặc chưa sẵn sàng.'}</p>
        <div className="mt-6 flex items-center gap-4">
          {error && <Button className="rounded-sm" onClick={retry}>Thử lại</Button>}
          <Link href={backHref} className="text-sm font-semibold text-primary">{backLabel}</Link>
        </div>
      </div>
    </ProfileShell>
  );

  const avatarStyle = landlord.avatarUrl ? { backgroundImage: `url(${JSON.stringify(landlord.avatarUrl)})` } : undefined;
  return (
    <ProfileShell>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <Link href={ownProfile ? '/landlord/profile' : backHref} className="text-sm font-semibold text-primary hover:underline">
          {ownProfile ? 'Hồ sơ của tôi' : backLabel}
        </Link>
        <header className="mt-6 border-y border-line py-7 sm:py-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-7">
            <div role="img" aria-label={`Ảnh đại diện của ${landlord.fullName}`} style={avatarStyle}
              className="flex h-24 w-24 shrink-0 items-center justify-center rounded-sm bg-primary-soft bg-cover bg-center text-2xl font-extrabold text-primary sm:h-28 sm:w-28">
              {!landlord.avatarUrl && profileInitials(landlord.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-primary">Chủ trọ</p>
              <h1 className="mt-1 break-words text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{landlord.fullName}</h1>
              <p className="mt-2 text-sm text-muted">Tham gia {new Date(landlord.joinedAt).toLocaleDateString('vi-VN')}</p>
            </div>
            {ownProfile && <Link href="/landlord/profile" className="inline-flex w-fit items-center rounded-sm border border-line px-4 py-2.5 text-sm font-semibold text-ink hover:border-primary hover:text-primary">Chỉnh sửa hồ sơ</Link>}
          </div>
        </header>
        {(user?.role === 'TENANT' || !user) && <div className="py-7">
          <h2 className="text-lg font-bold text-ink">Liên hệ</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Thông tin liên hệ có trong yêu cầu thuê đã được chấp nhận.</p>
          <Link href="/requests" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">Xem yêu cầu của tôi</Link>
        </div>}
      </div>
    </ProfileShell>
  );
}
