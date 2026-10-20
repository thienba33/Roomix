'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

// C1 · UC01.2 + UC01.6 — Sequential, honest gate:
//  1) credentials are validated inline first (required + email format);
//  2) only then does the face-scan step activate ("Bắt đầu quét" → scanning → success);
//  3) the "Rủi ro thấp" verdict is shown ONLY as the scan outcome, never pre-asserted.
// Mock seam: face-auth-service is an empty shell with ZERO endpoints
// (FUNCTION_MAP §2.11) — this scan is a simulation until that service is built.

type Phase = 'credentials' | 'ready' | 'scanning' | 'success';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [phase, setPhase] = useState<Phase>('credentials');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const credentialsDone = phase !== 'credentials';

  const handleCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    const em = email.trim();
    let ok = true;
    if (!em) {
      setEmailError('Vui lòng nhập email quản trị viên.');
      ok = false;
    } else if (!EMAIL_RE.test(em)) {
      setEmailError('Email chưa đúng định dạng (ví dụ: admin@roomix.vn).');
      ok = false;
    } else {
      setEmailError('');
    }
    if (!password) {
      setPasswordError('Vui lòng nhập mật khẩu.');
      ok = false;
    } else if (password.length < 8) {
      setPasswordError('Mật khẩu phải có ít nhất 8 ký tự.');
      ok = false;
    } else {
      setPasswordError('');
    }
    if (!ok) return;
    setPhase('ready');
  };

  const startScan = () => {
    if (phase !== 'ready') return;
    setPhase('scanning');
    // Simulated scan — no backend endpoint exists to call (face-auth-service: 0 endpoints).
    timer.current = setTimeout(() => setPhase('success'), 1800);
  };

  const resetToCredentials = () => {
    if (timer.current) clearTimeout(timer.current);
    setPhase('credentials');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-page px-4 py-10">
      <div className="mb-8 flex items-center gap-2.5">
        <Image src="/images/logo.png" alt="Roomix" width={1500} height={520} className="h-10 w-auto" priority />
      </div>

      <Card className="w-full max-w-[1060px] overflow-hidden rounded-3xl p-0 shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
        <div className="grid md:grid-cols-2">
          {/* LEFT — Form */}
          <div className="flex flex-col justify-center p-8 md:p-12">
            <span className="inline-flex w-fit items-center rounded-full bg-primary-soft px-3 py-1 text-[11px] font-bold tracking-wider text-primary-dark">
              ADMIN CONSOLE
            </span>
            <h1 className="mt-4 text-[26px] font-extrabold tracking-tight text-ink">Đăng nhập Admin</h1>

            <form onSubmit={handleCredentials} noValidate className="mt-6">
              <div className="space-y-4">
                <div>
                  <Input
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Email quản trị viên"
                    value={email}
                    disabled={credentialsDone}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    aria-invalid={!!emailError}
                    icon={
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                    }
                  />
                  {emailError && <p role="alert" className="mt-1.5 text-[13px] font-medium text-red-600">{emailError}</p>}
                </div>
                <div>
                  <div className="relative">
                    <Input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Mật khẩu"
                      value={password}
                      disabled={credentialsDone}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError('');
                      }}
                      aria-invalid={!!passwordError}
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
                  {passwordError && <p role="alert" className="mt-1.5 text-[13px] font-medium text-red-600">{passwordError}</p>}
                </div>
              </div>

              {!credentialsDone ? (
                <Button type="submit" size="lg" className="mt-6 w-full">
                  Tiếp tục · Xác thực khuôn mặt
                </Button>
              ) : (
                <div className="mt-6 space-y-2.5">
                  <p className="flex items-center gap-1.5 text-[13px] font-medium text-green-700">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    Thông tin đăng nhập hợp lệ — hoàn tất quét khuôn mặt để vào hệ thống.
                  </p>
                  <Button type="button" variant="outline" className="w-full" onClick={resetToCredentials} disabled={phase === 'scanning'}>
                    Dùng tài khoản khác
                  </Button>
                </div>
              )}
            </form>
            <p className="mt-3 text-[13px] leading-relaxed text-muted">
              Đăng nhập bất thường sẽ bị AI chặn và yêu cầu xác thực bổ sung.
            </p>
          </div>

          {/* RIGHT — Face panel */}
          <div className="m-4 flex flex-col items-center rounded-2xl bg-page p-8 md:m-5 md:ml-0">
            <h2 className="text-base font-bold text-ink">Xác thực khuôn mặt AI</h2>

            <div className="relative mt-6 w-[280px] max-w-full">
              <span className="absolute -left-3 -top-3 h-6 w-6 rounded-tl-md border-l-[3px] border-t-[3px] border-primary" aria-hidden />
              <span className="absolute -right-3 -top-3 h-6 w-6 rounded-tr-md border-r-[3px] border-t-[3px] border-primary" aria-hidden />
              <span className="absolute -bottom-3 -left-3 h-6 w-6 rounded-bl-md border-b-[3px] border-l-[3px] border-primary" aria-hidden />
              <span className="absolute -bottom-3 -right-3 h-6 w-6 rounded-br-md border-b-[3px] border-r-[3px] border-primary" aria-hidden />

              <div className={cn('relative flex h-[340px] w-full items-center justify-center overflow-hidden rounded-2xl border border-line bg-white', !credentialsDone && 'opacity-60')}>
                <div className="flex flex-col items-center" aria-hidden>
                  <div className="flex h-[104px] w-[104px] items-center justify-center rounded-full bg-primary-soft">
                    <div className="h-14 w-14 rounded-full bg-primary/25" />
                  </div>
                  <div className="mt-5 flex h-[92px] w-[150px] items-start justify-center overflow-hidden rounded-t-full bg-primary-soft">
                    <div className="mt-4 h-16 w-[104px] rounded-t-full bg-primary/25" />
                  </div>
                </div>
                {phase === 'scanning' && (
                  <span className="absolute left-4 right-4 top-[40%] h-[2.5px] animate-pulse rounded-full bg-primary shadow-[0_0_12px_rgba(79,70,229,0.6)]" aria-hidden />
                )}
                {phase === 'success' && (
                  <span className="absolute inset-x-4 top-[40%] flex justify-center" aria-hidden>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    </span>
                  </span>
                )}
              </div>
            </div>

            <p className="mt-6 text-sm font-medium text-ink" aria-live="polite">
              {phase === 'credentials' && 'Hoàn tất đăng nhập để kích hoạt quét khuôn mặt'}
              {phase === 'ready' && 'Nhìn thẳng vào camera'}
              {phase === 'scanning' && 'Đang quét khuôn mặt…'}
              {phase === 'success' && 'Xác thực khuôn mặt thành công'}
            </p>

            {/* Risk verdict — ONLY as scan outcome, never before a scan */}
            {phase === 'success' && (
              <div className="mt-3">
                <Badge tone="green" dot>
                  Rủi ro thấp · Thiết bị quen thuộc
                </Badge>
              </div>
            )}
            {phase === 'scanning' && <p className="mt-3 text-[13px] text-muted">Giữ nguyên vị trí, không đeo khẩu trang…</p>}

            <div className="mt-5 w-full max-w-[280px]">
              {phase === 'ready' && (
                <Button type="button" size="lg" className="w-full" onClick={startScan}>
                  Bắt đầu quét
                </Button>
              )}
              {phase === 'scanning' && (
                <Button type="button" size="lg" className="w-full" disabled>
                  Đang quét…
                </Button>
              )}
              {phase === 'success' && (
                <Button type="button" size="lg" className="w-full" onClick={() => router.push('/admin')}>
                  Vào Dashboard
                </Button>
              )}
              {phase === 'credentials' && (
                <Button type="button" size="lg" className="w-full" disabled>
                  Bắt đầu quét
                </Button>
              )}
            </div>

            <p className="mt-4 text-center text-xs leading-relaxed text-muted">
              Mô phỏng — face-auth-service chưa có endpoint nào ở backend.
            </p>

            {/* Step indicator — traversed for real */}
            <div className="mt-6 flex items-center gap-3">
              <span className="flex items-center gap-2">
                <span className={cn('flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold', credentialsDone ? 'bg-green-600 text-white' : 'bg-primary text-white')}>
                  {credentialsDone ? '✓' : '1'}
                </span>
                <span className="text-[13px] font-semibold text-ink">Đăng nhập</span>
              </span>
              <span className="h-px w-10 bg-line" aria-hidden />
              <span className="flex items-center gap-2">
                <span className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                  phase === 'success' ? 'bg-green-600 text-white' : credentialsDone ? 'bg-primary text-white' : 'border-2 border-primary bg-white text-primary',
                )}>
                  {phase === 'success' ? '✓' : '2'}
                </span>
                <span className={cn('text-[13px]', credentialsDone ? 'font-semibold text-ink' : 'font-medium text-muted')}>Quét khuôn mặt</span>
              </span>
            </div>
          </div>
        </div>
      </Card>

      <p className="mt-6 text-xs text-muted">C1 · UC01.6 · UC01.2</p>
    </div>
  );
}
