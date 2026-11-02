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
        <span className={styles.eyebrow}>KHÔNG GIAN TỐT HƠN. QUẢN LÝ DỄ DÀNG HƠN.</span>
        <h2>Giải pháp quản lý phòng<br />thông minh.</h2>
        <p>Kết nối mọi không gian, đơn giản hóa từng thao tác.<br />Cùng Roomix xây dựng trải nghiệm thuê phòng tốt hơn.</p>
        <div className={styles.brandNote}><span /> Một nơi để quản lý. Nhiều cơ hội để phát triển.</div>
      </div>
      <span className={styles.brandFooter}>ROOMIX · KHÔNG GIAN CỦA BẠN, TRONG TẦM TAY</span>
    </aside>
    <div className={styles.formSide}>
      <Link href="/" className={styles.back}>← Về trang tìm phòng</Link>
      <div className={styles.formWrap}>
        <section className={styles.card} aria-labelledby="admin-login-title">
          <p className={styles.kicker}>DÀNH CHO QUẢN TRỊ VIÊN</p>
          <h1 id="admin-login-title">Đăng nhập quản trị</h1>
          <p className={styles.intro}>Chào mừng trở lại. Chọn cách đăng nhập của bạn.</p>
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
        <p className={styles.help}>Không thể đăng nhập? Liên hệ quản trị viên.</p>
      </div>
    </div>
  </main>;
}
