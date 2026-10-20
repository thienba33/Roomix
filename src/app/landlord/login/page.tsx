'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const mailIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
);
const lockIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
);

const eyeIcon = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0" /><circle cx="12" cy="12" r="3" /></svg>
);

export default function DangNhapChuTroPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{identifier?: string; password?: string}>({});
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); const er: typeof errors = {}; if (!identifier.trim()) er.identifier = 'Nhập email hoặc số điện thoại'; else if (identifier.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim())) er.identifier = 'Email không hợp lệ'; if (!password) er.password = 'Nhập mật khẩu'; else if (password.length < 8) er.password = 'Mật khẩu phải có ít nhất 8 ký tự'; setErrors(er); if (Object.keys(er).length === 0) router.push('/landlord'); };
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-page px-4 py-10">
      <div className="flex items-center gap-2">
        <Image src="/images/logo.png" alt="Roomix" width={1500} height={520} className="h-10 w-auto" priority />
      </div>

      <Card className="mt-8 grid w-full max-w-5xl overflow-hidden rounded-3xl p-0 shadow-xl md:grid-cols-2">
        <div className="relative min-h-56 md:min-h-[540px]">
          <Image src="/images/rooms/room-405.webp" alt="Phòng trọ Roomix" fill priority className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-7">
            <h2 className="text-2xl font-extrabold leading-snug text-white">Quản lý nhà trọ nhẹ nhàng hơn</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/20 px-3.5 py-1.5 text-[13px] font-semibold text-white backdrop-blur">Lấp đầy 82%</span>
              <span className="rounded-full bg-white/20 px-3.5 py-1.5 text-[13px] font-semibold text-white backdrop-blur">Doanh thu tháng 84,5 tr</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center p-8 md:p-10">
          <h1 className="text-2xl font-extrabold text-ink">Đăng nhập chủ trọ</h1>
          <p className="mt-1.5 text-sm text-muted">Quản lý nhà trọ của bạn</p>

          <form className="mt-7 space-y-4" onSubmit={handleSubmit} noValidate>
            <div><Input name="email" type="text" placeholder="Email hoặc số điện thoại" icon={mailIcon} autoComplete="username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />{errors.identifier && <p className="mt-1 text-[13px] font-medium text-red-600" role="alert">{errors.identifier}</p>}</div>
            <div className="relative">
              <Input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mật khẩu"
                icon={lockIcon}
                autoComplete="current-password"
                className="pr-11"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted transition hover:text-ink"
              >
                {eyeIcon}
              </button>
            </div>{errors.password && <p className="-mt-2 text-[13px] font-medium text-red-600" role="alert">{errors.password}</p>}
            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-muted">
                <input type="checkbox" className="h-4 w-4 accent-[#4F46E5]" />
                Ghi nhớ đăng nhập
              </label>
              <span className="cursor-pointer font-semibold text-primary">Quên mật khẩu?</span>
            </div>
            <Button type="submit" size="lg" className="w-full">Đăng nhập</Button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-line" />
            <span className="text-[13px] text-muted">hoặc</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <Button variant="outline" size="lg" className="w-full" onClick={() => router.push('/landlord')}>
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-line text-sm font-bold text-primary">G</span>
            Tiếp tục với Google
          </Button>

          <p className="mt-7 text-center text-sm text-muted">
            Chưa cho thuê trên Roomix?{' '}
            <Link href="/register" className="font-semibold text-primary">Đăng ký chủ trọ</Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
