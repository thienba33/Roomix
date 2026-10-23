'use client';
import { useState, type FormEvent } from 'react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ValidationMessage from './ValidationMessage';
import { validateLoginUsername as validateAccount, validateLoginPassword as validatePassword } from '@/lib/auth-validation';
import { mockLogin, type AuthResponse } from '@/services/mock/auth';
import { cn } from '@/lib/utils';

const MailIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>
);
const LockIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
);

export default function LoginForm({ initialRole, onSuccess, onRegister, showDemoAccounts = true }: { initialRole: 'tenant' | 'landlord'; onSuccess: (response: AuthResponse) => void; onRegister?: (role: 'tenant' | 'landlord') => void; showDemoAccounts?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ account: '', password: '' });
  const [touched, setTouched] = useState({ account: false, password: false });

  const check = (field: 'account' | 'password', value: string) => {
    const msg = field === 'account' ? validateAccount(value) : validatePassword(value);
    setErrors((e) => ({ ...e, [field]: msg }));
    return msg;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ account: true, password: true });
    const a = check('account', account);
    const p = check('password', password);
    if (a || p) return;
    if (busy) return;
    setBusy(true);
    setSubmitError('');
    try { onSuccess(await mockLogin(account, password)); }
    catch (error) { setSubmitError(error instanceof Error ? error.message : 'Không thể đăng nhập.'); }
    finally { setBusy(false); }
  };

  const errCls = (has: boolean) => (has ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : '');

  return (
    <div>
      <div className="mb-3 flex justify-center">
        <Image src="/images/logo.png" alt="Roomix" width={1961} height={680} className="h-8 w-auto" priority />
      </div>
      <h2 className="text-center text-2xl font-extrabold text-ink">Chào mừng đến Roomix</h2>

      <form onSubmit={onSubmit} noValidate className="mt-4 space-y-4">
        <div>
          <Input
            name="account"
            type="text"
            value={account}
            onChange={(e) => {
              setAccount(e.target.value);
              if (touched.account) check('account', e.target.value);
            }}
            onBlur={() => {
              setTouched((t) => ({ ...t, account: true }));
              check('account', account);
            }}
            placeholder="Tên đăng nhập *" aria-label="Tên đăng nhập"
            aria-required="true"
            aria-invalid={touched.account && !!errors.account}
            aria-describedby="login-account-error"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            icon={MailIcon}
            className={cn('h-[44px] rounded-xl text-[15px]', errCls(touched.account && !!errors.account))}
          />
          <ValidationMessage id="login-account-error" message={touched.account ? errors.account : ''} reserveMessage="Tên đăng nhập tối đa 50 ký tự." />
        </div>
        <div>
          <div className="relative">
            <Input
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (touched.password) check('password', e.target.value);
              }}
              onBlur={() => {
                setTouched((t) => ({ ...t, password: true }));
                check('password', password);
              }}
              placeholder="Mật khẩu *" aria-label="Mật khẩu"
              aria-required="true"
              aria-invalid={touched.password && !!errors.password}
            aria-describedby="login-password-error"
              autoComplete="current-password"
              icon={LockIcon}
              className={cn('h-[44px] rounded-xl pr-11 text-[15px]', errCls(touched.password && !!errors.password))}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted transition hover:text-ink"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
            </button>
          </div>
          <ValidationMessage id="login-password-error" message={touched.password ? errors.password : ''} reserveMessage="Mật khẩu tối đa 72 ký tự." />
        </div>

        <p role="alert" className="min-h-10 text-sm text-red-600">{submitError}</p>
        <Button type="submit" disabled={busy} size="lg" className="h-[44px] w-full">{busy ? 'Đang đăng nhập…' : 'Đăng nhập'}</Button>
      </form>
      {showDemoAccounts && <details className="mt-3 rounded-xl bg-page p-3 text-xs text-muted">
        <summary className="cursor-pointer font-semibold">Tài khoản trải nghiệm</summary>
        <p className="mt-2 leading-6">Khách thuê: tenant_demo · Chủ trọ: landlord_demo<br />Chờ duyệt: pending_demo · Bị khóa: locked_demo<br />Mật khẩu chung: Roomix123!</p>
      </details>}

      {onRegister && <p className="mt-4 text-center text-sm text-muted">
        Chưa có tài khoản?{' '}
        <button type="button" onClick={() => onRegister(initialRole)} className="font-semibold text-primary hover:underline">Đăng ký</button>
      </p>}
    </div>
  );
}
