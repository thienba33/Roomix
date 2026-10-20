'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const MailIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>
);
const LockIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    router.push('/');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-page px-4 py-10">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <Image src="/images/logo.png" alt="Roomix" width={36} height={36} className="h-9 w-9 object-contain" />
        <span className="text-[22px] font-extrabold tracking-tight text-ink">Room<span className="text-primary">ix</span></span>
      </Link>

      <Card className="grid w-full max-w-5xl overflow-hidden rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.10)] md:grid-cols-2">
        <div className="relative hidden min-h-[560px] md:block">
          <Image src="/images/rooms/room-302-a.jpg" alt="Phòng trọ Roomix" fill sizes="50vw" className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-8">
            <h2 className="text-[26px] font-extrabold leading-snug text-white">Tìm phòng dễ hơn với AI</h2>
            <p className="mt-1.5 text-sm text-white/85">Hơn 1.200 phòng đã kiểm duyệt trên Roomix.</p>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <h1 className="text-2xl font-extrabold text-ink">Chào mừng đến Roomix</h1>
          <p className="mt-1.5 text-sm text-muted">Đăng nhập để tiếp tục tìm phòng</p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <Input name="account" type="text" placeholder="Email hoặc số điện thoại" autoComplete="username" icon={MailIcon} />
            <div className="relative">
              <Input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mật khẩu"
                autoComplete="current-password"
                icon={LockIcon}
                className="pr-11"
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

            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-ink">
                <input type="checkbox" className="h-4 w-4 rounded accent-[#4F46E5]" />
                Ghi nhớ đăng nhập
              </label>
              <a href="#" className="font-semibold text-primary hover:underline">Quên mật khẩu?</a>
            </div>

            <Button type="submit" size="lg" className="w-full">Đăng nhập</Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-[13px] text-muted">
            <span className="h-px flex-1 bg-line" />
            hoặc
            <span className="h-px flex-1 bg-line" />
          </div>

          <Button type="button" variant="outline" size="lg" className="w-full">
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
