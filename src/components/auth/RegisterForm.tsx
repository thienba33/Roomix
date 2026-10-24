'use client';
import { useState, type FormEvent } from 'react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ValidationMessage from './ValidationMessage';
import { registerValidators } from '@/lib/auth-validation';
import { mockRegister, type AuthResponse } from '@/services/mock/auth';
import { cn } from '@/lib/utils';

const UserIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
const MailIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>
);
const PhoneIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
);
const AtIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" /></svg>
);
const LockIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
);

const ROLES = ['Khách thuê', 'Chủ trọ'] as const;
type Role = (typeof ROLES)[number];

type Field = 'fullName' | 'username' | 'email' | 'phone' | 'password';
type Values = Record<Field, string>;
type Errors = Record<Field, string>;

/** Mirrors backend RegisterRequest (POST /api/auth/register). */
const VALIDATORS = registerValidators;

const ERROR_SPACE: Record<Field, string> = {
  fullName: 'Họ tên tối đa 100 ký tự.',
  username: 'Tên đăng nhập 4–50 ký tự, chỉ gồm chữ, số, dấu . _ -',
  email: 'Email hợp lệ, tối đa 254 ký tự.',
  phone: 'Số điện thoại 9–15 chữ số, có thể bắt đầu bằng +.',
  password: 'Mật khẩu từ 8–72 ký tự.',
};

const EMPTY: Values = { fullName: '', username: '', email: '', phone: '', password: '' };
const NO_ERRORS: Errors = { fullName: '', username: '', email: '', phone: '', password: '' };

export default function RegisterForm({ initialRole, onLogin, onSuccess, onBrowse }: { initialRole: 'tenant' | 'landlord'; onBrowse: () => void; onLogin: (role: 'tenant' | 'landlord') => void; onSuccess: (response: AuthResponse) => void }) {
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [pending, setPending] = useState(false);
  const [role, setRole] = useState<Role>(initialRole === 'landlord' ? 'Chủ trọ' : 'Khách thuê');
  const [showPassword, setShowPassword] = useState(false);
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>(NO_ERRORS);
  const [touched, setTouched] = useState<Record<Field, boolean>>({
    fullName: false, username: false, email: false, phone: false, password: false,
  });

  const check = (field: Field, value: string) => {
    const msg = VALIDATORS[field](value);
    setErrors((e) => ({ ...e, [field]: msg }));
    return msg;
  };

  const bind = (field: Field) => ({
    value: values[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((v) => ({ ...v, [field]: e.target.value }));
      if (touched[field]) check(field, e.target.value);
    },
    onBlur: () => {
      setTouched((t) => ({ ...t, [field]: true }));
      check(field, values[field]);
    },
    'aria-describedby': `register-${field}-error`,
    'aria-required': true,
    'aria-invalid': touched[field] && !!errors[field],
  });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ fullName: true, username: true, email: true, phone: true, password: true });
    const msgs = (Object.keys(VALIDATORS) as Field[]).map((f) => check(f, values[f]));
    if (msgs.some(Boolean)) return;
    if (busy) return;
    setBusy(true);
    setSubmitError('');
    try {
      const result = await mockRegister({ ...values, phoneNumber: values.phone, role: role === 'Chủ trọ' ? 'LANDLORD' : 'TENANT' });
      if (result.user.status === 'PENDING_VERIFICATION') setPending(true);
      else onSuccess(result);
    } catch (error) { setSubmitError(error instanceof Error ? error.message : 'Không thể đăng ký.'); }
    finally { setBusy(false); }
  };

  const errCls = (field: Field) => (touched[field] && errors[field] ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : '');
  const errMsg = (field: Field) => (
    <ValidationMessage id={`register-${field}-error`} message={touched[field] ? errors[field] : ''} reserveMessage={ERROR_SPACE[field]} />
  );

  if (pending) return (
    <div className="space-y-5 py-4 text-center">
      <h2 className="text-2xl font-extrabold text-ink">Đăng ký thành công</h2>
      <p role="status" className="text-sm leading-6 text-muted">Yêu cầu đăng ký chủ trọ đã được ghi nhận. Bạn có thể đăng nhập sau khi quản trị viên phê duyệt tài khoản.</p>
      <Button onClick={() => onLogin('landlord')} className="w-full">Quay lại đăng nhập</Button>
      <button type="button" onClick={onBrowse} className="text-sm font-semibold text-primary">Tiếp tục xem phòng</button>
    </div>
  );

  return (
    <div>
      <div className="mb-3 flex justify-center">
        <Image src="/images/logo.png" alt="Roomix" width={1961} height={680} className="h-8 w-auto" priority />
      </div>
      <h2 className="text-center text-2xl font-extrabold text-ink">Tạo tài khoản</h2>

      <form onSubmit={onSubmit} noValidate className="mt-4 space-y-2">
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink">Bạn là</p>
          <div className="flex rounded-xl bg-page p-1">
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                disabled={busy}
                onClick={() => setRole(r)}
                aria-pressed={role === r}
                className={cn('flex-1 rounded-lg px-3 py-2.5 text-sm transition', role === r ? 'bg-white font-bold text-ink shadow-sm' : 'font-medium text-muted hover:text-ink')}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Input name="fullName" type="text" placeholder="Họ tên *" aria-label="Họ tên" autoComplete="name" icon={UserIcon} className={cn('h-[44px] rounded-xl text-[15px]', errCls('fullName'))} {...bind('fullName')} />
          {errMsg('fullName')}
        </div>
        <div>
          <Input name="username" type="text" placeholder="Tên đăng nhập *" aria-label="Tên đăng nhập" autoComplete="username" icon={AtIcon} className={cn('h-[44px] rounded-xl text-[15px]', errCls('username'))} {...bind('username')} />
          {errMsg('username')}
        </div>
        <div>
          <Input name="email" type="email" placeholder="Email *" aria-label="Email" autoComplete="email" inputMode="email" icon={MailIcon} className={cn('h-[44px] rounded-xl text-[15px]', errCls('email'))} {...bind('email')} />
          {errMsg('email')}
        </div>
        <div>
          <Input name="phoneNumber" type="tel" placeholder="Số điện thoại *" aria-label="Số điện thoại" autoComplete="tel" inputMode="tel" icon={PhoneIcon} className={cn('h-[44px] rounded-xl text-[15px]', errCls('phone'))} {...bind('phone')} />
          {errMsg('phone')}
        </div>
        <div>
          <div className="relative">
            <Input
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Mật khẩu *" aria-label="Mật khẩu"
              autoComplete="new-password"
              icon={LockIcon}
              className={cn('h-[44px] rounded-xl pr-11 text-[15px]', errCls('password'))}
              {...bind('password')}
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
          {errMsg('password')}
        </div>



        <p role="alert" className="min-h-10 text-sm text-red-600">{submitError}</p>
        <Button type="submit" disabled={busy} size="lg" className="h-[44px] w-full">{busy ? 'Đang đăng ký…' : 'Đăng ký'}</Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted">
        Đã có tài khoản?{' '}
        <button type="button" onClick={() => onLogin(role === 'Chủ trọ' ? 'landlord' : 'tenant')} className="font-semibold text-primary hover:underline">Đăng nhập</button>
      </p>
    </div>
  );
}
