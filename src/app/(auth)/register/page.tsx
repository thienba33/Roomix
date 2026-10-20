'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { cn } from '@/lib/utils';

const UserIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
const MailIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>
);
const LockIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
);

const ROLES = ['Khách thuê', 'Chủ trọ'] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<(typeof ROLES)[number]>('Khách thuê');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-page px-4 py-10">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <Image src="/images/logo.png" alt="Roomix" width={36} height={36} className="h-9 w-9 object-contain" />
        <span className="text-[22px] font-extrabold tracking-tight text-ink">Room<span className="text-primary">ix</span></span>
      </Link>

      <Card className="grid w-full max-w-5xl overflow-hidden rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.10)] md:grid-cols-2">
        <div className="relative hidden min-h-[560px] md:block">
          <Image src="/images/rooms/room-405.webp" alt="Phòng trọ Roomix" fill sizes="50vw" className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-8">
            <h2 className="text-[26px] font-extrabold leading-snug text-white">Đăng ký tài khoản Roomix</h2>
            <p className="mt-1.5 text-sm text-white/85">Tìm phòng hoặc cho thuê phòng — tất cả trong một nền tảng.</p>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <h1 className="text-2xl font-extrabold text-ink">Tạo tài khoản</h1>
          <p className="mt-1.5 text-sm text-muted">Điền thông tin để bắt đầu với Roomix</p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <Input name="fullname" type="text" placeholder="Họ tên" autoComplete="name" icon={UserIcon} />
            <Input name="account" type="text" placeholder="Email hoặc số điện thoại" autoComplete="username" icon={MailIcon} />
            <Input name="password" type="password" placeholder="Mật khẩu" autoComplete="new-password" icon={LockIcon} />

            <div>
              <p className="mb-1.5 text-sm font-medium text-ink">Bạn là</p>
              <div className="flex rounded-xl bg-page p-1">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={cn('flex-1 rounded-lg px-3 py-2.5 text-sm transition', role === r ? 'bg-white font-bold text-ink shadow-sm' : 'font-medium text-muted hover:text-ink')}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full">Đăng ký</Button>
          </form>

          <p className="mt-7 text-center text-sm text-muted">
            Đã có tài khoản?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">Đăng nhập</Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
