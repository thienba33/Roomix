'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoginForm from '@/components/auth/LoginForm';
import { useAdminAuth } from '@/components/auth/AdminAuthProvider';
import AdminFaceLogin from '@/components/auth/AdminFaceLogin';
export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAdminAuth();
  const [method, setMethod] = useState<'PASSWORD' | 'FACE'>('PASSWORD');
  const [busy, setBusy] = useState(false);
  return <main className="mx-auto w-full max-w-[480px] px-6 py-12">
    <p className="mb-5 text-center font-semibold text-primary">Quản trị Roomix</p>
    <div className="mb-5 flex gap-2" aria-label="Phương thức đăng nhập">
      {(['PASSWORD', 'FACE'] as const).map((value) => <button key={value} type="button"
        aria-pressed={method === value} disabled={busy} onClick={() => setMethod(value)}
        className={`flex-1 rounded-xl border px-3 py-3 text-sm font-semibold disabled:opacity-50 ${method === value ? 'border-primary bg-primary-soft text-primary' : 'border-line text-muted'}`}>
        {value === 'PASSWORD' ? 'Tài khoản / mật khẩu' : 'Khuôn mặt'}
      </button>)}
    </div>
    {method === 'PASSWORD' ? <LoginForm initialRole="tenant" onLogin={async (username, password) => {
      setBusy(true);
      try { await login(username, password); router.push('/admin'); }
      finally { setBusy(false); }
    }} /> : <AdminFaceLogin onBusyChange={setBusy} />}
    <p className="mt-4 text-center text-sm text-muted">Chỉ dành cho tài khoản quản trị đã được cấp.</p>
    <Link href="/" className="mt-5 block text-center text-sm text-primary">Về trang tìm phòng</Link>
  </main>;
}
