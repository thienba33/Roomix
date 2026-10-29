'use client';

import { useEffect, useRef, useState } from 'react';
import { useAdminAuth } from '@/components/auth/AdminAuthProvider';
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
    if (result.status === 'SUCCEEDED') setMessage('Đăng ký khuôn mặt thành công.');
    else if (result.status === 'FAILED') setMessage(faceErrorMessage({ code: result.reason }));
    else setMessage(result.reason === 'CORE_PENDING' ? 'Kết quả đang chờ Core xác nhận. Chưa hoàn tất đăng ký.'
      : faceActions[result.action ?? ''] ?? 'Phiên đang xử lý.');
  };

  const start = async () => {
    if (inProgress.current || !video.current || !canvas.current || !session) return;
    inProgress.current = true;
    setBusy(true);
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
    const operation = new AbortController();
    controller.current = operation;
    try { showResult(await client.current.readStatus(operation.signal)); }
    catch (error) { setFailed(!operation.signal.aborted); setMessage(faceErrorMessage(error)); }
    finally { inProgress.current = false; setBusy(false); }
  };

  return <section className="admin-face space-y-5">
    <h1 className="text-[28px] font-extrabold">Đăng ký khuôn mặt</h1>
    {session?.method !== 'PASSWORD' && <p role="alert" className="text-red-600">Bạn cần đăng xuất và đăng nhập lại bằng mật khẩu để đăng ký hoặc thay khuôn mặt.</p>}
    <p className="text-muted">{session?.user.fullName}. Đăng ký lại sẽ thay mẫu khuôn mặt cũ.</p>
    <div className="admin-face-layout"><div><video ref={video} autoPlay muted playsInline aria-label="Camera đăng ký khuôn mặt" className="aspect-[4/3] w-full rounded-2xl bg-black object-contain" />
    <canvas ref={canvas} hidden /></div><div className="admin-face-controls">
    <p role={failed ? 'alert' : 'status'} aria-live="polite" className={failed ? 'text-red-600' : 'text-ink'}>{message}</p>
    <div className="flex flex-wrap gap-3">
      <Button onClick={start} disabled={busy || session?.method !== 'PASSWORD'}>{busy ? 'Đang xử lý…' : 'Bắt đầu đăng ký'}</Button>
      <Button variant="outline" onClick={stop} disabled={!busy}>Dừng</Button>
      <Button variant="outline" onClick={readResult} disabled={busy || !canRead}>Đọc lại kết quả</Button>
    </div>
    <details className="text-sm text-muted"><summary className="cursor-pointer font-semibold text-primary">Thông tin camera</summary><p className="mt-3 leading-6">Camera chỉ mở khi bạn bắt đầu, không thu âm và tự tắt khi kết thúc hoặc rời trang. Nếu gửi Telegram đã được cấu hình, đăng ký thành công sẽ tạo thông báo kèm ảnh.</p></details></div></div>
  </section>;
}
