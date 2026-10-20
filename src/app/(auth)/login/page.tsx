'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { cn } from '@/lib/utils';

const MailIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>
);
const LockIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^0\d{9}$/;

function validateAccount(v: string): string {
  if (!v.trim()) return 'Vui lòng nhập email hoặc số điện thoại.';
  if (!EMAIL_RE.test(v.trim()) && !PHONE_RE.test(v.trim())) return 'Email hoặc số điện thoại chưa đúng định dạng.';
  return '';
}

function validatePassword(v: string): string {
  if (!v) return 'Vui lòng nhập mật khẩu.';
  if (v.length < 8) return 'Mật khẩu tối thiểu 8 ký tự.';
  return '';
}

export default function LoginPage() {
  const router = useRouter();
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

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched({ account: true, password: true });
    const a = check('account', account);
    const p = check('password', password);
    if (a || p) return;
    router.push('/');
  };

  const errCls = (has: boolean) => (has ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : '');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-page px-4 py-10">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <Image src="/images/logo.png" alt="Roomix" width={1500} height={520} className="h-10 w-auto" priority />
      </Link>

      <Card className="grid w-full max-w-[1080px] overflow-hidden rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.10)] md:h-[640px] md:grid-cols-2">
        <div className="relative hidden md:block">
          <Image src="/images/rooms/room-302-a.jpg" alt="Phòng trọ Roomix" fill sizes="50vw" className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-8">
            <h2 className="text-[26px] font-extrabold leading-snug text-white">Tìm phòng dễ hơn với AI</h2>
            <p className="mt-1.5 text-sm text-white/85">Hơn 1.200 phòng đã kiểm duyệt trên Roomix.</p>
          </div>
        </div>

        <div className="flex flex-col justify-center p-8 sm:p-12">
          <h1 className="text-2xl font-extrabold text-ink">Chào mừng đến Roomix</h1>
          <p className="mt-1.5 text-sm text-muted">Đăng nhập để tiếp tục tìm phòng</p>

          <form onSubmit={onSubmit} noValidate className="mt-7 space-y-4">
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
                placeholder="Email hoặc số điện thoại *"
                aria-required="true"
                aria-invalid={touched.account && !!errors.account}
                autoComplete="username"
                inputMode="email"
                icon={MailIcon}
                className={cn('h-[52px] rounded-xl text-[15px]', errCls(touched.account && !!errors.account))}
              />
              {touched.account && errors.account && <p role="alert" className="mt-1.5 text-[13px] font-medium text-red-600">{errors.account}</p>}
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
                  placeholder="Mật khẩu *"
                  aria-required="true"
                  aria-invalid={touched.password && !!errors.password}
                  autoComplete="current-password"
                  icon={LockIcon}
                  className={cn('h-[52px] rounded-xl pr-11 text-[15px]', errCls(touched.password && !!errors.password))}
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
              {touched.password && errors.password && <p role="alert" className="mt-1.5 text-[13px] font-medium text-red-600">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-ink">
                <input type="checkbox" className="h-4 w-4 rounded accent-[#4F46E5]" />
                Ghi nhớ đăng nhập
              </label>
              <a href="#" className="font-semibold text-primary hover:underline">Quên mật khẩu?</a>
            </div>

            <Button type="submit" size="lg" className="h-[52px] w-full">Đăng nhập</Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-[13px] text-muted">
            <span className="h-px flex-1 bg-line" />
            hoặc
            <span className="h-px flex-1 bg-line" />
          </div>

          <Button type="button" variant="outline" size="lg" className="h-[52px] w-full">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-line text-[13px] font-extrabold text-ink">G</span>
            Tiếp tục với Google
          </Button>

          <p className="mt-7 text-center text-sm text-muted">
            Chưa có tài khoản?{' '}
            <Link href="/register" className="font-semibold text-primary hover:underline">Đăng ký</Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
