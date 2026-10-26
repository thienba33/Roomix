'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { changeMockPassword, updateMockProfile } from '@/services/mock/auth';

export default function AccountProfile({ role }: { role: 'TENANT' | 'LANDLORD' }) {
  const { user, ready, openAuth } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileNotice, setProfileNotice] = useState('');
  const [editing, setEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordNotice, setPasswordNotice] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  if (!ready) return <p className="py-8 text-muted">Đang tải hồ sơ…</p>;
  if (!user) return <div className="space-y-4 py-8"><h1 className="text-2xl font-bold">Hồ sơ của tôi</h1><p>Đăng nhập để xem thông tin tài khoản.</p><Button onClick={() => openAuth('login', role === 'TENANT' ? 'tenant' : 'landlord')}>Đăng nhập</Button></div>;
  if (user.role !== role) return <p className="py-8">Tài khoản hiện tại không có quyền xem hồ sơ này.</p>;

  const initials = user.fullName.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase();
  const fields = [
    ['Họ tên', user.fullName], ['Tên đăng nhập', user.username], ['Email', user.email], ['Số điện thoại', user.phoneNumber],
    ['Vai trò', role === 'TENANT' ? 'Khách thuê' : 'Chủ trọ'],
    ['Trạng thái tài khoản', user.status === 'ACTIVE' ? 'Đang hoạt động' : user.status === 'LOCKED' ? 'Đã khóa' : 'Chờ phê duyệt'],
  ];
  const startEdit = () => {
    setFullName(user.fullName);
    setPhone(user.phoneNumber);
    setProfileError('');
    setProfileNotice('');
    setEditing(true);
  };
  const saveProfile = () => {
    try {
      updateMockProfile(user.id, { fullName, phoneNumber: phone });
      setProfileNotice('Đã lưu thông tin hồ sơ.');
      setProfileError('');
      setEditing(false);
    } catch (cause) {
      setProfileError(cause instanceof Error ? cause.message : 'Không thể lưu hồ sơ.');
    }
  };
  const savePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu mới nhập lại chưa khớp.');
      return;
    }
    setSavingPassword(true);
    setPasswordError('');
    try {
      await changeMockPassword(user.id, currentPassword, newPassword);
      setPasswordNotice('Đã đổi mật khẩu.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (cause) {
      setPasswordError(cause instanceof Error ? cause.message : 'Không thể đổi mật khẩu.');
    } finally {
      setSavingPassword(false);
    }
  };

  return <div className="space-y-6">
    <h1 className="text-2xl font-bold text-ink">Hồ sơ của tôi</h1>
    <Card className="p-6">
      <div className="flex items-center gap-4"><span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xl font-bold text-primary">{initials}</span><div className="min-w-0"><h2 className="break-words text-lg font-bold">{user.fullName}</h2><p className="text-sm text-muted">{role === 'TENANT' ? 'Khách thuê' : 'Chủ trọ'}</p></div></div>
      <dl className="mt-6 grid gap-5 border-t border-line pt-6 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label}><dt className="text-sm text-muted">{label}</dt><dd className="mt-1 break-words font-medium">{value || 'Chưa cung cấp'}</dd></div>)}</dl>
    </Card>

    <Card className="space-y-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="font-bold">Chỉnh sửa hồ sơ</h2><p className="mt-1 text-sm text-muted">Tên đăng nhập và email không đổi. Bản mock: thay đổi chỉ lưu trên trình duyệt này.</p></div>
        {!editing && <Button variant="outline" onClick={startEdit}>Chỉnh sửa</Button>}
      </div>
      {editing ? <>
        <Input id="profile-fullname" label="Họ tên *" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Input id="profile-phone" label="Số điện thoại *" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="VD: 0912345678" />
        {profileError && <p role="alert" className="text-sm text-red-600">{profileError}</p>}
        <div className="flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={() => setEditing(false)}>Hủy</Button><Button onClick={saveProfile}>Lưu thay đổi</Button></div>
      </> : profileNotice ? <p role="status" className="text-sm font-medium text-emerald-700">{profileNotice}</p> : null}
    </Card>

    <Card className="space-y-4 p-6">
      <div><h2 className="font-bold">Đổi mật khẩu</h2><p className="mt-1 text-sm text-muted">Mật khẩu mới từ 8–72 ký tự. Cần nhập đúng mật khẩu hiện tại.</p></div>
      <Input id="profile-current-password" label="Mật khẩu hiện tại *" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
      <Input id="profile-new-password" label="Mật khẩu mới *" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
      <Input id="profile-confirm-password" label="Nhập lại mật khẩu mới *" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
      {passwordError && <p role="alert" className="text-sm text-red-600">{passwordError}</p>}
      {passwordNotice && <p role="status" className="text-sm font-medium text-emerald-700">{passwordNotice}</p>}
      <div className="flex justify-end"><Button onClick={savePassword} disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}>{savingPassword ? 'Đang lưu…' : 'Đổi mật khẩu'}</Button></div>
      <p className="text-xs text-muted">Đổi mật khẩu ở đây chỉ áp dụng cho bản mock trên trình duyệt này; backend chưa có endpoint đổi mật khẩu.</p>
    </Card>

    <div className="flex flex-wrap gap-3">{(role === 'TENANT' ? [{ href: '/requests', label: 'Yêu cầu của tôi' }, { href: '/contracts', label: 'Hợp đồng của tôi' }, { href: '/favorites', label: 'Phòng yêu thích' }] : [{ href: '/landlord/rooms', label: 'Phòng của tôi' }, { href: '/landlord/tenants', label: 'Hợp đồng thuê' }]).map((item) => <Link key={item.href} href={item.href} className="rounded-xl border border-line px-4 py-3 text-sm font-semibold hover:text-primary">{item.label}</Link>)}</div>
  </div>;
}
