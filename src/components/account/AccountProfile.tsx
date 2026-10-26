'use client';
import { useAuth } from '@/components/auth/AuthProvider';
import Button from '@/components/ui/Button';
export default function AccountProfile({ role }: { role: 'TENANT' | 'LANDLORD' }) {
  const { user, ready, openAuth } = useAuth();
  if (!ready) return <p role="status">Đang tải hồ sơ…</p>;
  if (!user) return <Button onClick={() => openAuth('login', role === 'LANDLORD' ? 'landlord' : 'tenant')}>Đăng nhập</Button>;
  if (user.role !== role) return <p role="alert">Bạn không có quyền xem hồ sơ này.</p>;
  return <section className="space-y-6"><h1 className="text-2xl font-bold">Hồ sơ của tôi</h1><dl className="grid gap-5 rounded-2xl border border-line p-6 sm:grid-cols-2">{[['Họ tên', user.fullName], ['Tên đăng nhập', user.username], ['Email', user.email], ['Số điện thoại', user.phoneNumber], ['Vai trò', role === 'TENANT' ? 'Khách thuê' : 'Chủ trọ']].map(([label, value]) => <div key={label}><dt className="text-sm text-muted">{label}</dt><dd className="mt-1 break-words font-semibold">{value}</dd></div>)}</dl><p className="text-sm text-muted">Chỉnh sửa hồ sơ và đổi mật khẩu hiện chưa được hỗ trợ. Liên hệ quản trị viên nếu cần cập nhật.</p></section>;
}
