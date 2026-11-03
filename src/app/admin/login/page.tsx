'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import styles from './login.module.css';
import LoginForm from '@/components/auth/LoginForm';
import { useAdminAuth } from '@/components/auth/AdminAuthProvider';
import AdminFaceLogin from '@/components/auth/AdminFaceLogin';
export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAdminAuth();
  const [method, setMethod] = useState<'PASSWORD' | 'FACE'>('PASSWORD');
  const [busy, setBusy] = useState(false);
  return <main className={styles.screen}>
    <aside className={styles.brand} aria-label="Roomix — quản lý phòng thông minh">
      <Image src="/images/rooms/room-510.jpg" alt="" fill priority sizes="50vw" className={styles.room} />
      <div className={styles.tint} />
      <Link href="/" aria-label="Roomix — trang chủ" className={styles.logo}>
        <Image src="/images/logo.png" alt="Roomix" width={1961} height={680} priority />
      </Link>
      <div className={styles.brandCopy}>
        <h2>Quản trị Roomix</h2>
      </div>
    </aside>
    <div className={styles.formSide}>
      <Link href="/" className={styles.back}>← Về trang tìm phòng</Link>
      <div className={styles.formWrap}>
        <section className={styles.card} aria-labelledby="admin-login-title">
          <h1 id="admin-login-title">Đăng nhập quản trị</h1>
          <div className={styles.methods} role="group" aria-label="Phương thức đăng nhập">
            {(['PASSWORD', 'FACE'] as const).map((value) => <button key={value} type="button"
              aria-pressed={method === value} disabled={busy} onClick={() => setMethod(value)}>
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
    </div>
  </main>;
}
