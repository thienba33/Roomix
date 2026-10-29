'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import LoginForm from '@/components/auth/LoginForm';
import { useAdminAuth } from '@/components/auth/AdminAuthProvider';
import AdminFaceLogin from '@/components/auth/AdminFaceLogin';
export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAdminAuth();
  const [method, setMethod] = useState<'PASSWORD' | 'FACE'>('PASSWORD');
  const [busy, setBusy] = useState(false);
  return <main className="admin-login-screen flex min-h-dvh flex-col bg-page">
    <header className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-5 py-5 sm:px-8">
      <Link href="/" aria-label="Roomix"><Image src="/images/logo.png" alt="Roomix" width={1961} height={680} className="h-8 w-auto" priority /></Link>
      <Link href="/" className="text-sm text-muted hover:text-primary">Về trang tìm phòng</Link>
    </header>
    <div className="flex flex-1 items-center justify-center px-4 pb-12 pt-6">
      <section className="admin-login w-full max-w-[440px] rounded-md border border-line bg-white px-5 py-7 sm:px-7" aria-labelledby="admin-login-title">
        <h1 id="admin-login-title" className="text-2xl font-bold tracking-tight">Đăng nhập quản trị</h1>
        <div className="admin-login-methods mt-6 flex border-b border-line" role="group" aria-label="Phương thức đăng nhập">
          {(['PASSWORD', 'FACE'] as const).map((value) => <button key={value} type="button"
            aria-pressed={method === value} disabled={busy} onClick={() => setMethod(value)}
            className={`flex-1 border-b-2 px-2 py-3 text-sm font-semibold disabled:opacity-50 ${method === value ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-ink'}`}>
            {value === 'PASSWORD' ? 'Tài khoản' : 'Khuôn mặt'}
          </button>)}
        </div>
        {method === 'PASSWORD' ? <LoginForm appearance="admin" initialRole="tenant" onLogin={async (username, password) => {
          setBusy(true);
          try { await login(username, password); router.push('/admin'); }
          finally { setBusy(false); }
        }} /> : <AdminFaceLogin onBusyChange={setBusy} />}
      </section>
    </div>
  </main>;
}
