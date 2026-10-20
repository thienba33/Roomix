'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';

export default function AdminLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-page px-4 py-10">
      {/* Logo above */}
      <div className="mb-8 flex items-center gap-2.5">
        <Image src="/images/logo.png" alt="Roomix" width={36} height={36} className="h-9 w-9 object-contain" />
        <span className="text-2xl font-extrabold tracking-tight text-ink">
          Room<span className="text-primary">ix</span>
        </span>
      </div>

      <Card className="w-full max-w-4xl overflow-hidden rounded-3xl p-0 shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
        <div className="grid md:grid-cols-2">
          {/* LEFT — Form */}
          <div className="flex flex-col justify-center p-8">
            <span className="inline-flex w-fit items-center rounded-full bg-primary-soft px-3 py-1 text-[11px] font-bold tracking-wider text-primary-dark">
              ADMIN CONSOLE
            </span>
            <h1 className="mt-4 text-[26px] font-extrabold tracking-tight text-ink">Đăng nhập Admin</h1>

            <div className="mt-6 space-y-4">
              <Input
                name="email"
                type="email"
                placeholder="Email quản trị viên"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                }
              />
              <div className="relative">
                <Input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-11"
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted transition hover:text-ink"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
            </div>

            <Button
              size="lg"
              className="mt-6 w-full"
              onClick={() => router.push('/admin')}
            >
              Tiếp tục · Xác thực khuôn mặt
            </Button>
            <p className="mt-3 text-center text-[13px] leading-relaxed text-muted">
              Đăng nhập bất thường sẽ bị AI chặn và yêu cầu xác thực bổ sung.
            </p>
          </div>

          {/* RIGHT — Face panel */}
          <div className="flex flex-col items-center bg-page p-8">
            <h2 className="text-base font-bold text-ink">Xác thực khuôn mặt AI</h2>

            {/* Camera viewport */}
            <div className="relative mt-6 w-[280px] max-w-full">
              {/* Corner brackets — outside the viewport */}
              <span className="absolute -left-3 -top-3 h-6 w-6 rounded-tl-md border-l-[3px] border-t-[3px] border-primary" aria-hidden />
              <span className="absolute -right-3 -top-3 h-6 w-6 rounded-tr-md border-r-[3px] border-t-[3px] border-primary" aria-hidden />
              <span className="absolute -bottom-3 -left-3 h-6 w-6 rounded-bl-md border-b-[3px] border-l-[3px] border-primary" aria-hidden />
              <span className="absolute -bottom-3 -right-3 h-6 w-6 rounded-br-md border-b-[3px] border-r-[3px] border-primary" aria-hidden />

              <div className="relative flex h-[340px] w-full items-center justify-center overflow-hidden rounded-2xl border border-line bg-white">
                {/* Face placeholder */}
                <div className="flex flex-col items-center" aria-hidden>
                  {/* Head */}
                  <div className="flex h-[104px] w-[104px] items-center justify-center rounded-full bg-primary-soft">
                    <div className="h-14 w-14 rounded-full bg-primary/25" />
                  </div>
                  {/* Shoulders */}
                  <div className="mt-5 flex h-[92px] w-[150px] items-start justify-center overflow-hidden rounded-t-full bg-primary-soft">
                    <div className="mt-4 h-16 w-[104px] rounded-t-full bg-primary/25" />
                  </div>
                </div>
                {/* Scan line */}
                <span className="absolute left-4 right-4 top-[40%] h-[2.5px] rounded-full bg-primary shadow-[0_0_12px_rgba(79,70,229,0.6)]" aria-hidden />
              </div>
            </div>

            <p className="mt-6 text-sm font-medium text-ink">Nhìn thẳng vào camera</p>

            <div className="mt-3">
              <Badge tone="green" dot>
                Rủi ro thấp · Thiết bị quen thuộc
              </Badge>
            </div>

            {/* Step indicator */}
            <div className="mt-8 flex items-center gap-3">
              <span className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">1</span>
                <span className="text-[13px] font-semibold text-ink">Đăng nhập</span>
              </span>
              <span className="h-px w-10 bg-line" aria-hidden />
              <span className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary bg-white text-xs font-bold text-primary">2</span>
                <span className="text-[13px] font-medium text-muted">Quét khuôn mặt</span>
              </span>
            </div>
          </div>
        </div>
      </Card>

      <p className="mt-6 text-xs text-muted">C1 · UC01.6 · UC01.2</p>
    </div>
  );
}
