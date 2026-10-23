'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ValidationMessage from './ValidationMessage';
import { cn } from '@/lib/utils';

function validateEmail(value: string) {
  if (!value.trim()) return 'Vui lòng nhập email đã đăng ký.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Email chưa đúng định dạng.';
  return '';
}

export default function ForgotPasswordForm({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const error = touched ? validateEmail(email) : '';

  useEffect(() => {
    headingRef.current?.focus();
  }, [submittedEmail]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);
    if (validateEmail(email)) return;
    // UI preview only: no email is sent and no reset token is generated.
    setSubmittedEmail(email.trim());
  };

  return (
    <div>
      <div className="mb-3 flex justify-center">
        <Image src="/images/logo.png" alt="Roomix" width={1961} height={680} className="h-8 w-auto" priority />
      </div>
      <h2 ref={headingRef} tabIndex={-1} className="text-center text-2xl font-extrabold text-ink outline-none">
        {submittedEmail ? 'Kiểm tra email của bạn' : 'Quên mật khẩu?'}
      </h2>

      {submittedEmail ? (
        <div className="mt-5 space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
          </div>
          <p className="text-center text-sm leading-6 text-muted">
            Khi tính năng được kích hoạt, nếu email <strong className="break-all font-semibold text-ink">{submittedEmail}</strong> khớp với tài khoản Roomix, bạn sẽ nhận được liên kết đặt lại mật khẩu. Hãy kiểm tra cả thư mục thư rác.
          </p>
          <p role="status" className="rounded-xl bg-primary-soft px-4 py-3 text-sm leading-6 text-primary">
            Đây là bản mô phỏng. Chưa có email nào được gửi.
          </p>
          <Button type="button" className="h-11 w-full" onClick={onLogin}>Quay lại đăng nhập</Button>
          <button type="button" onClick={() => { setSubmittedEmail(''); setTouched(false); }} className="block w-full rounded-lg py-2 text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary">
            Thử email khác
          </button>
        </div>
      ) : (
        <>
          <p className="mt-3 text-center text-sm leading-6 text-muted">Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.</p>
          <form onSubmit={onSubmit} noValidate className="mt-5">
            <Input
              id="forgot-password-email"
              name="email"
              type="email"
              label="Email đã đăng ký"
              placeholder="Nhập email của bạn"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => setTouched(true)}
              aria-invalid={!!error}
              aria-describedby="forgot-password-email-error"
              icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>}
              className={cn('h-11 rounded-xl text-[15px]', error && 'border-red-400 focus:border-red-500 focus:ring-red-200')}
            />
            <ValidationMessage id="forgot-password-email-error" message={error} reserveMessage="Vui lòng nhập email đã đăng ký." />
            <Button type="submit" className="mt-3 h-11 w-full">Gửi liên kết đặt lại mật khẩu</Button>
          </form>
          <button type="button" onClick={onLogin} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 5-7 7 7 7M5 12h14" /></svg>
            Quay lại đăng nhập
          </button>
        </>
      )}
    </div>
  );
}
