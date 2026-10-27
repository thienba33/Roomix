'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { profileInitials } from '@/lib/tenant-store';
import {
  changePassword,
  updateProfile,
  type SessionUser,
} from '@/services/backend/auth';

type AccountRole = 'TENANT' | 'LANDLORD';
type Feedback = { kind: 'success' | 'error'; message: string } | null;

export default function AccountProfile({ role }: { role: AccountRole }) {
  const { user, ready, openAuth, logout, updateUser } = useAuth();

  if (!ready) return <p role="status">Đang tải hồ sơ…</p>;
  if (!user) {
    return (
      <Button onClick={() => openAuth('login', role === 'LANDLORD' ? 'landlord' : 'tenant')}>
        Đăng nhập
      </Button>
    );
  }
  if (user.role !== role) return <p role="alert">Bạn không có quyền xem hồ sơ này.</p>;

  return (
    <AccountProfileEditor
      user={user}
      role={role}
      onProfileUpdated={updateUser}
      onPasswordChanged={logout}
    />
  );
}

function AccountProfileEditor({
  user,
  role,
  onProfileUpdated,
  onPasswordChanged,
}: {
  user: SessionUser;
  role: AccountRole;
  onProfileUpdated: (user: SessionUser) => void;
  onPasswordChanged: () => void;
}) {
  const [profile, setProfile] = useState({
    fullName: user.fullName,
    phoneNumber: user.phoneNumber,
    avatarUrl: user.avatarUrl ?? '',
    zalo: user.zalo ?? '',
  });
  const [profileFeedback, setProfileFeedback] = useState<Feedback>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const avatarStyle = profile.avatarUrl.trim()
    ? { backgroundImage: `url(${JSON.stringify(profile.avatarUrl.trim())})` }
    : undefined;

  const submitProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingProfile(true);
    setProfileFeedback(null);

    try {
      const updated = await updateProfile({
        fullName: profile.fullName.trim(),
        phoneNumber: profile.phoneNumber.trim(),
        avatarUrl: profile.avatarUrl.trim() || null,
        zalo: role === 'LANDLORD' ? profile.zalo.trim() || null : user.zalo ?? null,
      });
      setProfile({
        fullName: updated.fullName,
        phoneNumber: updated.phoneNumber,
        avatarUrl: updated.avatarUrl ?? '',
        zalo: updated.zalo ?? '',
      });
      onProfileUpdated(updated);
      setProfileFeedback({ kind: 'success', message: 'Đã cập nhật hồ sơ thành công.' });
    } catch (cause) {
      setProfileFeedback({
        kind: 'error',
        message: cause instanceof Error ? cause.message : 'Không thể cập nhật hồ sơ.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError('');

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword(passwords);
      onPasswordChanged();
    } catch (cause) {
      setPasswordError(cause instanceof Error ? cause.message : 'Không thể đổi mật khẩu.');
      setChangingPassword(false);
    }
  };

  return (
    <section className="space-y-6 pb-8">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink sm:text-[32px]">
            Hồ sơ của tôi
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Cập nhật thông tin cá nhân và bảo vệ tài khoản của bạn.
          </p>
        </div>
        {role === 'LANDLORD' && (
          <Link
            href={`/landlords/${user.id}`}
            className="inline-flex rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-primary transition hover:border-primary"
          >
            Xem hồ sơ công khai
          </Link>
        )}
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <form onSubmit={submitProfile} className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-center">
            <div
              role="img"
              aria-label={`Ảnh đại diện của ${profile.fullName || user.username}`}
              style={avatarStyle}
              className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-primary-soft bg-cover bg-center text-2xl font-extrabold text-primary"
            >
              {!profile.avatarUrl.trim() && profileInitials(profile.fullName || user.username)}
            </div>
            <div className="min-w-0">
              <h2 className="break-words text-xl font-bold text-ink">{profile.fullName || user.username}</h2>
              <p className="mt-1 break-all text-sm text-muted">{user.email}</p>
              <span className="mt-3 inline-flex rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                {role === 'LANDLORD' ? 'Chủ trọ' : 'Khách thuê'}
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Input
              label="Họ và tên"
              name="fullName"
              required
              maxLength={100}
              value={profile.fullName}
              onChange={(event) => setProfile((current) => ({ ...current, fullName: event.target.value }))}
            />
            <Input
              label="Số điện thoại"
              name="phoneNumber"
              type="tel"
              required
              pattern="[0-9+() .-]{7,20}"
              value={profile.phoneNumber}
              onChange={(event) => setProfile((current) => ({ ...current, phoneNumber: event.target.value }))}
            />
            <Input label="Tên đăng nhập" value={user.username} disabled />
            <Input label="Email" type="email" value={user.email} disabled />
            <div className="sm:col-span-2">
              <Input
                label="Đường dẫn ảnh đại diện"
                name="avatarUrl"
                type="url"
                maxLength={500}
                placeholder="https://example.com/avatar.jpg"
                value={profile.avatarUrl}
                onChange={(event) => setProfile((current) => ({ ...current, avatarUrl: event.target.value }))}
              />
            </div>
            {role === 'LANDLORD' && (
              <div className="sm:col-span-2">
                <Input
                  label="Số điện thoại hoặc đường dẫn Zalo"
                  name="zalo"
                  maxLength={100}
                  placeholder="Ví dụ: 0901234567 hoặc https://zalo.me/0901234567"
                  value={profile.zalo}
                  onChange={(event) => setProfile((current) => ({ ...current, zalo: event.target.value }))}
                />
                <p className="mt-2 text-xs leading-5 text-muted">
                  Thông tin này xuất hiện trên danh thiếp liên hệ sau khi bạn chấp nhận yêu cầu thuê.
                </p>
              </div>
            )}
          </div>

          {profileFeedback && (
            <p
              role={profileFeedback.kind === 'error' ? 'alert' : 'status'}
              className={`mt-5 rounded-xl p-3 text-sm ${
                profileFeedback.kind === 'error'
                  ? 'bg-red-50 text-red-800'
                  : 'bg-green-50 text-green-800'
              }`}
            >
              {profileFeedback.message}
            </p>
          )}

          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? 'Đang lưu…' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>

        <form onSubmit={submitPassword} className="h-fit rounded-2xl border border-line bg-white p-5 sm:p-6">
          <h2 className="text-lg font-bold text-ink">Đổi mật khẩu</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Sau khi đổi mật khẩu, bạn cần đăng nhập lại trên các thiết bị.
          </p>

          <div className="mt-5 space-y-4">
            <Input
              label="Mật khẩu hiện tại"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              value={passwords.currentPassword}
              onChange={(event) => setPasswords((current) => ({ ...current, currentPassword: event.target.value }))}
            />
            <Input
              label="Mật khẩu mới"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              value={passwords.newPassword}
              onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))}
            />
            <Input
              label="Xác nhận mật khẩu mới"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              value={passwords.confirmPassword}
              onChange={(event) => setPasswords((current) => ({ ...current, confirmPassword: event.target.value }))}
            />
          </div>

          {passwordError && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">
              {passwordError}
            </p>
          )}

          <Button type="submit" variant="outline" className="mt-5 w-full" disabled={changingPassword}>
            {changingPassword ? 'Đang đổi mật khẩu…' : 'Đổi mật khẩu'}
          </Button>
        </form>
      </div>
    </section>
  );
}
