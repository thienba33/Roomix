'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoginForm from '@/components/auth/LoginForm';
import { saveSession } from '@/services/backend/auth';
export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  return <main className="mx-auto w-full max-w-[480px] px-6 py-12">
    <p className="mb-5 text-center font-semibold text-primary">Quản trị Roomix</p>
    <LoginForm initialRole="tenant" onSuccess={(auth) => {
      if (auth.user.role !== 'ADMIN') { setError('Tài khoản này không có quyền quản trị.'); return; }
      saveSession(auth); router.push('/admin/moderation');
    }} />
    <p className="mt-4 text-center text-sm text-muted">Chỉ dành cho tài khoản quản trị đã được cấp.</p>
    <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>
    <Link href="/" className="mt-5 block text-center text-sm text-primary">Về trang tìm phòng</Link>
  </main>;
}
