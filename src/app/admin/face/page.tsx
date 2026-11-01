'use client';

import { useEffect, useRef, useState } from 'react';
import { useAdminAuth } from '@/components/auth/AdminAuthProvider';
import styles from './face.module.css';
import cameraStyles from '@/components/auth/AdminFaceLogin.module.css';
import Button from '@/components/ui/Button';
import { createAdminAuthClient } from '@/services/admin-auth';
import { FaceCameraClient, type FaceResult } from '@/services/face-camera.mjs';
import { faceActions, faceErrorMessage, faceProgressMessage } from '@/services/face-messages';

const gateway = '/backend';
const core = createAdminAuthClient({ baseUrl: gateway });

export default function AdminFacePage() {
  const { session } = useAdminAuth();
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const client = useRef<FaceCameraClient | null>(null);
  const controller = useRef<AbortController | null>(null);
  const inProgress = useRef(false);
  const [busy, setBusy] = useState(false);
  const [canRead, setCanRead] = useState(false);
  const [message, setMessage] = useState('Chuẩn bị nơi đủ sáng và chỉ để một người trước camera.');
  const [failed, setFailed] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const stop = () => {
    controller.current?.abort();
    client.current?.stop();
  };

  useEffect(() => {
    const release = () => {
      controller.current?.abort();
      client.current?.stop();
    };
    window.addEventListener('pagehide', release);
    return () => {
      release();
      window.removeEventListener('pagehide', release);
    };
  }, []);

  const showResult = (result: FaceResult) => {
    setFailed(result.status === 'FAILED');
    setSucceeded(result.status === 'SUCCEEDED');
    if (result.status === 'SUCCEEDED') setMessage('Đăng ký khuôn mặt thành công.');
    else if (result.status === 'FAILED') setMessage(faceErrorMessage({ code: result.reason }));
    else setMessage(result.reason === 'CORE_PENDING' ? 'Kết quả đang chờ Core xác nhận. Chưa hoàn tất đăng ký.'
      : faceActions[result.action ?? ''] ?? 'Phiên đang xử lý.');
  };

  const start = async () => {
    if (inProgress.current || !video.current || !canvas.current || !session) return;
    inProgress.current = true;
    setBusy(true);
    setSucceeded(false);
    setCanRead(false);
    setFailed(false);
    setMessage('Đang tạo phiên đăng ký…');
    const operation = new AbortController();
    controller.current = operation;
    const camera = new FaceCameraClient({
      video: video.current, canvas: canvas.current,
      fetchFn: (path, options) => fetch(`${gateway}${String(path)}`, { ...options, redirect: 'error' }),
      onUpdate(update) {
        if (operation.signal.aborted) return;
        if (update.phase === 'OPENING_CAMERA') setMessage('Đang xin quyền camera…');
        if (update.phase === 'CAPTURING') setMessage(faceProgressMessage(update.action, update.reason));
        if (update.phase === 'RETRYING') setMessage('Dịch vụ đang bận. Đang thử lại cùng yêu cầu…');
      },
    });
    client.current = camera;
    try {
      const enrollment = await core.createEnrollment(session, operation.signal);
      if (operation.signal.aborted) return;
      const result = await camera.start({ authSessionId: enrollment.authSessionId, purpose: 'ENROLL', token: session.accessToken });
      if (!operation.signal.aborted) showResult(result);
    } catch (error) {
      setFailed(!operation.signal.aborted);
      setMessage(faceErrorMessage(error));
    } finally {
      camera.stop();
      inProgress.current = false;
      setBusy(false);
      setCanRead(Boolean(camera.challengeId));
    }
  };

  const readResult = async () => {
    if (inProgress.current || !client.current) return;
    inProgress.current = true;
    setBusy(true);
    setSucceeded(false);
    const operation = new AbortController();
    controller.current = operation;
    try { showResult(await client.current.readStatus(operation.signal)); }
    catch (error) { setFailed(!operation.signal.aborted); setMessage(faceErrorMessage(error)); }
    finally { inProgress.current = false; setBusy(false); }
  };

  return <section className={styles.page}>
    <header className={styles.header}>
      <p className={styles.eyebrow}>BẢO MẬT TÀI KHOẢN</p>
      <h1>Đăng ký khuôn mặt</h1>
      <p>{session?.user.fullName ?? 'Tài khoản Admin'} · Đăng ký lại sẽ thay mẫu khuôn mặt cũ.</p>
    </header>
    {session?.method !== 'PASSWORD' && <p role="alert" className={styles.warning}>Bạn cần đăng xuất và đăng nhập lại bằng mật khẩu để đăng ký hoặc thay khuôn mặt.</p>}
    <div role={failed ? 'alert' : 'status'} aria-live="polite" aria-atomic="true"
      className={`${styles.feedback} ${failed ? styles.feedbackError : succeeded ? styles.feedbackSuccess : styles.feedbackInfo}`}>
      <span className={styles.feedbackIcon} aria-hidden="true">{failed ? '!' : succeeded ? '✓' : 'i'}</span>
      <div><p className={styles.feedbackTitle}>{failed ? 'Chưa thể đăng ký khuôn mặt' : succeeded ? 'Đăng ký thành công' : busy ? 'Làm theo hướng dẫn' : 'Hướng dẫn đăng ký'}</p>
        <p className={styles.feedbackMessage}>{message}</p></div>
    </div>
    <div className={styles.layout}>
      <div className={styles.cameraCard}>
        <div className={cameraStyles.camera} data-active={busy}>
          <video ref={video} autoPlay muted playsInline aria-label="Camera đăng ký khuôn mặt" />
          <div className={cameraStyles.overlay} aria-hidden="true"><div className={cameraStyles.faceFrame}><span /></div></div>
          <span className={cameraStyles.cameraLabel} aria-hidden="true"><i />{busy ? 'ĐANG THỰC HIỆN ĐĂNG KÝ' : 'CAMERA CHỈ MỞ KHI BẠN BẮT ĐẦU'}</span>
        </div>
        <canvas ref={canvas} hidden />
        <p className={styles.cameraHint}>Đặt khuôn mặt trong khung và làm theo hướng dẫn quay đầu.</p>
      </div>
      <aside className={styles.controls} aria-label="Hướng dẫn đăng ký khuôn mặt">
        <span className={styles.step}>ĐĂNG KÝ KHUÔN MẶT</span>
        <h2>{succeeded ? 'Đã lưu khuôn mặt' : busy ? 'Đang đăng ký' : 'Sẵn sàng bắt đầu?'}</h2>
        <div className={styles.actions}>
          <Button onClick={start} loading={busy} disabled={busy || session?.method !== 'PASSWORD'}>{busy ? 'Đang xử lý…' : 'Bắt đầu đăng ký'}</Button>
          <Button variant="outline" className={styles.stop} onClick={stop} disabled={!busy}>Dừng</Button>
          <Button variant="outline" className={styles.read} title="Đọc lại kết quả đăng ký" aria-label="Đọc lại kết quả đăng ký" onClick={readResult} disabled={busy || !canRead}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 10a9 9 0 1 1 2 8M3 4v6h6" /></svg>
          </Button>
        </div>
        <div className={styles.tips}>
          <h3>Để đăng ký thuận lợi</h3>
          <ul><li>Chọn nơi đủ sáng, tránh ánh sáng từ phía sau.</li><li>Chỉ để một người trước camera.</li><li>Giữ camera ổn định và quay đầu chậm.</li></ul>
        </div>
        <details className={styles.privacy}><summary>Camera và thông báo</summary><p>Camera chỉ mở khi bạn bắt đầu, không thu âm và tự tắt khi kết thúc hoặc rời trang. Nếu Telegram đã được cấu hình, đăng ký thành công sẽ gửi thông báo kèm ảnh.</p></details>
      </aside>
    </div>
  </section>;
}
