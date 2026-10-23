'use client';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function AccountProfile({ role }: { role: 'TENANT' | 'LANDLORD' }) {
  const { user, ready, openAuth } = useAuth();
  if (!ready) return <p className="py-8 text-muted">Đang tải hồ sơ…</p>;
  if (!user) return <div className="space-y-4 py-8"><h1 className="text-2xl font-bold">Hồ sơ của tôi</h1><p>Đăng nhập để xem thông tin tài khoản.</p><Button onClick={() => openAuth('login', role === 'TENANT' ? 'tenant' : 'landlord')}>Đăng nhập</Button></div>;
  if (user.role !== role) return <p className="py-8">Tài khoản hiện tại không có quyền xem hồ sơ này.</p>;
  const initials = user.fullName.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase();
  const fields = [
    ['Họ tên', user.fullName], ['Tên đăng nhập', user.username], ['Email', user.email], ['Số điện thoại', user.phoneNumber],
    ['Vai trò', role === 'TENANT' ? 'Khách thuê' : 'Chủ trọ'],
    ['Trạng thái tài khoản', user.status === 'ACTIVE' ? 'Đang hoạt động' : user.status === 'LOCKED' ? 'Đã khóa' : 'Chờ phê duyệt'],
  ];
  return <div className="space-y-6">
    <h1 className="text-2xl font-bold text-ink">Hồ sơ của tôi</h1>
    <Card className="p-6">
      <div className="flex items-center gap-4"><span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xl font-bold text-primary">{initials}</span><div className="min-w-0"><h2 className="break-words text-lg font-bold">{user.fullName}</h2><p className="text-sm text-muted">{role === 'TENANT' ? 'Khách thuê' : 'Chủ trọ'}</p></div></div>
      <dl className="mt-6 grid gap-5 border-t border-line pt-6 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label}><dt className="text-sm text-muted">{label}</dt><dd className="mt-1 break-words font-medium">{value || 'Chưa cung cấp'}</dd></div>)}</dl>
    </Card>
    <Card className="space-y-2 p-6"><h2 className="font-bold">Quản lý tài khoản</h2><p className="text-sm leading-6 text-muted">Chức năng chỉnh sửa hồ sơ và đổi mật khẩu chưa khả dụng.</p></Card>
    <div className="flex flex-wrap gap-3">{(role === 'TENANT' ? [{ href: '/requests', label: 'Yêu cầu của tôi' }, { href: '/contracts', label: 'Hợp đồng của tôi' }, { href: '/favorites', label: 'Phòng yêu thích' }] : [{ href: '/landlord/rooms', label: 'Phòng của tôi' }, { href: '/landlord/tenants', label: 'Hợp đồng thuê' }]).map((item) => <Link key={item.href} href={item.href} className="rounded-xl border border-line px-4 py-3 text-sm font-semibold hover:text-primary">{item.label}</Link>)}</div>
  </div>;
}
