'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './AdminFaceLogin.module.css';
import Button from '@/components/ui/Button';
import { useAdminAuth } from './AdminAuthProvider';
import { createAdminAuthClient, type FaceLoginSession } from '@/services/admin-auth';
import { FaceCameraClient, type FaceResult } from '@/services/face-camera.mjs';
import { faceActions, faceErrorMessage, faceProgressMessage } from '@/services/face-messages';

const gateway = '/backend';
const core = createAdminAuthClient({ baseUrl: gateway });

export default function AdminFaceLogin({ onBusyChange }: { onBusyChange: (busy: boolean) => void }) {
  const { completeFaceLogin, logout } = useAdminAuth();
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const camera = useRef<FaceCameraClient | null>(null);
  const ticket = useRef<FaceLoginSession | null>(null);
  const operation = useRef<AbortController | null>(null);
  const inProgress = useRef(false);
  const [busy, setBusy] = useState(false);
  const [canRead, setCanRead] = useState(false);
  const [message, setMessage] = useState('Dùng khuôn mặt đã đăng ký cho tài khoản Admin.');
  const [failed, setFailed] = useState(false);

  const stop = () => { operation.current?.abort(); camera.current?.stop(); };

  useEffect(() => {
    const release = () => {
      operation.current?.abort();
      camera.current?.stop();
      ticket.current = null;
    };
    window.addEventListener('pagehide', release);
    return () => { release(); window.removeEventListener('pagehide', release); };
  }, []);

  const finish = async (result: FaceResult, signal: AbortSignal) => {
    if (signal.aborted) return;
    if (result.status === 'SUCCEEDED' && ticket.current) {
      setMessage('Khuôn mặt đã được xác thực. Đang hoàn tất đăng nhập…');
      await completeFaceLogin(ticket.current, result.status, signal);
      ticket.current = null;
      if (!signal.aborted) router.push('/admin');
    } else if (result.status === 'FAILED') {
      ticket.current = null;
      setFailed(true);
      setMessage(faceErrorMessage({ code: result.reason }));
    } else {
      setMessage(result.reason === 'CORE_PENDING' ? 'Kết quả đang chờ Core. Chưa hoàn tất đăng nhập.'
        : faceActions[result.action ?? ''] ?? 'Phiên đang xử lý.');
    }
  };

  const run = async (readOnly: boolean) => {
    if (inProgress.current || !video.current || !canvas.current) return;
    inProgress.current = true;
    setBusy(true);
    onBusyChange(true);
    setFailed(false);
    const controller = new AbortController();
    operation.current = controller;
    try {
      if (readOnly) {
        if (camera.current && ticket.current) await finish(await camera.current.readStatus(controller.signal), controller.signal);
        return;
      }
      logout();
      ticket.current = null;
      setCanRead(false);
      setMessage('Đang tạo phiên đăng nhập…');
      const client = new FaceCameraClient({
        video: video.current, canvas: canvas.current,
        fetchFn: (path, options) => fetch(`${gateway}${String(path)}`, { ...options, redirect: 'error' }),
        onUpdate(update) {
          if (controller.signal.aborted) return;
          if (update.phase === 'OPENING_CAMERA') setMessage('Đang xin quyền camera…');
          if (update.phase === 'CAPTURING') setMessage(faceProgressMessage(update.action, update.reason));
          if (update.phase === 'RETRYING') setMessage('Dịch vụ đang bận. Đang thử lại cùng yêu cầu…');
        },
      });
      camera.current = client;
      ticket.current = await core.createFaceLogin(controller.signal);
      if (controller.signal.aborted) return;
      const result = await client.start({ authSessionId: ticket.current.authSessionId, purpose: 'LOGIN' });
      await finish(result, controller.signal);
    } catch (error) {
      setFailed(!controller.signal.aborted);
      setMessage(faceErrorMessage(error));
    } finally {
      camera.current?.stop();
      inProgress.current = false;
      setBusy(false);
      onBusyChange(false);
      setCanRead(Boolean(camera.current?.challengeId && ticket.current));
    }
  };

  return <section className="mt-5 space-y-4">
    <p className="text-sm text-muted">Chỉ để một người trước camera và làm theo hướng dẫn quay đầu.</p>
    <div className={styles.camera} data-active={busy}>
      <video ref={video} autoPlay muted playsInline aria-label="Camera đăng nhập khuôn mặt" />
      <div className={styles.overlay} aria-hidden="true"><div className={styles.faceFrame}><span /></div></div>
      <span className={styles.cameraLabel} aria-hidden="true"><i />{busy ? 'ĐANG XÁC THỰC' : 'CAMERA SẴN SÀNG KHI BẮT ĐẦU'}</span>
    </div>
    <canvas ref={canvas} hidden />
    <p role={failed ? 'alert' : 'status'} aria-live="polite" className={failed ? 'text-sm text-red-600' : 'text-sm text-ink'}>{message}</p>
    <div className={styles.actions}>
      <Button onClick={() => run(false)} loading={busy} disabled={busy}>{busy ? 'Đang xử lý…' : 'Bắt đầu đăng nhập'}</Button>
      <Button variant="outline" className={styles.stop} onClick={stop} disabled={!busy}>Dừng</Button>
      <Button variant="outline" className={styles.read} title="Đọc lại kết quả xác thực" aria-label="Đọc lại kết quả xác thực" onClick={() => run(true)} disabled={busy || !canRead}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 10a9 9 0 1 1 2 8M3 4v6h6" /></svg>
      </Button>
    </div>
    <p className="text-xs text-muted">Camera không thu âm và tự tắt khi kết thúc hoặc rời trang. Chưa đăng ký mặt? Hãy đăng nhập bằng mật khẩu trước.</p>
  </section>;
}
