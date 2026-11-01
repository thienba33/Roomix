'use client';

import { useRouter } from 'next/navigation';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  const router = useRouter();
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg items-center px-5 py-10">
      <section className="w-full rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <ForgotPasswordForm onLogin={() => router.push('/login')} />
      </section>
    </main>
  );
}
