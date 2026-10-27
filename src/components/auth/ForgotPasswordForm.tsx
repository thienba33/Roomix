'use client';

import { useState, type FormEvent } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { forgotPassword, resetPassword } from '@/services/backend/auth';

export default function ForgotPasswordForm({ onLogin }: { onLogin: () => void }) {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRequestToken = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setBusy(true);
    try {
      await forgotPassword(email.trim());
      setSuccess('Yêu cầu đã được gửi! Nếu email tồn tại trong hệ thống, bạn sẽ nhận được mã đặt lại mật khẩu.');
      setStep('reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi yêu cầu đặt lại mật khẩu.');
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setError('');
    setSuccess('');
    setBusy(true);
    try {
      await resetPassword({
        token: token.trim(),
        newPassword,
        confirmPassword,
      });
      setSuccess('Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.');
      setTimeout(() => {
        onLogin();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đặt lại mật khẩu.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 py-2">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-ink">
          {step === 'request' ? 'Quên mật khẩu' : 'Đặt lại mật khẩu'}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {step === 'request'
            ? 'Nhập địa chỉ email để nhận mã xác thực đặt lại mật khẩu.'
            : 'Nhập mã xác thực đã nhận cùng mật khẩu mới của bạn.'}
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {success}
        </div>
      )}

      {step === 'request' ? (
        <form onSubmit={handleRequestToken} className="space-y-4">
          <Input
            id="forgot-email"
            type="email"
            label="Địa chỉ email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@domain.com"
          />
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Đang gửi yêu cầu…' : 'Gửi mã xác nhận'}
          </Button>
          <div className="flex items-center justify-between pt-2 text-xs">
            <button
              type="button"
              onClick={() => setStep('reset')}
              className="font-medium text-primary hover:underline"
            >
              Đã có mã xác nhận?
            </button>
            <button
              type="button"
              onClick={onLogin}
              className="text-muted hover:text-ink hover:underline"
            >
              Quay lại đăng nhập
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <Input
            id="reset-token"
            label="Mã đặt lại mật khẩu (Token)"
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Nhập mã xác nhận..."
          />
          <Input
            id="new-password"
            type="password"
            label="Mật khẩu mới (tối thiểu 8 ký tự)"
            required
            minLength={8}
            maxLength={72}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            id="confirm-password"
            type="password"
            label="Xác nhận mật khẩu mới"
            required
            minLength={8}
            maxLength={72}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Đang đặt lại mật khẩu…' : 'Xác nhận đổi mật khẩu'}
          </Button>
          <div className="flex items-center justify-between pt-2 text-xs">
            <button
              type="button"
              onClick={() => setStep('request')}
              className="text-muted hover:text-ink hover:underline"
            >
              Gửi lại mã xác nhận
            </button>
            <button
              type="button"
              onClick={onLogin}
              className="font-medium text-primary hover:underline"
            >
              Quay lại đăng nhập
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
