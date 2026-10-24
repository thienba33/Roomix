'use client';
import Button from '@/components/ui/Button';

export default function ForgotPasswordForm({ onLogin }: { onLogin: () => void }) {
  return <div className="space-y-5 py-4 text-center">
    <h2 className="text-2xl font-extrabold text-ink">Quên mật khẩu</h2>
    <p className="text-sm leading-6 text-muted">Khôi phục mật khẩu hiện chưa được hỗ trợ. Vui lòng quay lại đăng nhập.</p>
    <Button onClick={onLogin} className="w-full">Quay lại đăng nhập</Button>
  </div>;
}
