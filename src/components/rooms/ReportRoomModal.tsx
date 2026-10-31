'use client';

import { useState, type FormEvent } from 'react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/components/auth/AuthProvider';
import { createReport } from '@/services/backend/reports';

export default function ReportRoomModal({
  roomTitle,
  roomCode,
  roomId,
  onClose,
}: {
  roomTitle: string;
  roomCode: string;
  roomId: string;
  onClose?: () => void;
}) {
  const { user, openAuth } = useAuth();
  const [reasonCategory, setReasonCategory] = useState('INACCURATE_INFO');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      openAuth('login', 'tenant');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await createReport({
        targetType: 'ROOM',
        targetId: roomId,
        reason: reasonCategory,
        description: details.trim(),
      });
      setSubmitted(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể gửi báo cáo vi phạm.');
    } finally {
      setBusy(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-4 py-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 text-xl">
          ✓
        </div>
        <h3 className="text-lg font-bold text-ink">Đã gửi báo cáo vi phạm</h3>
        <p className="text-sm leading-6 text-muted">
          Cảm ơn bạn đã phản hồi về bài đăng <strong>{roomTitle}</strong>. Ban quản trị sẽ xác minh và xử lý theo quy chế hệ thống.
        </p>
        {onClose && (
          <Button onClick={onClose} className="mt-2">
            Đóng
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      <p className="text-sm text-muted">
        Báo cáo bài đăng <strong>{roomTitle}</strong> (Mã phòng: {roomCode.slice(0, 8)}).
      </p>

      <label className="block text-sm font-semibold">
        Lý do báo cáo vi phạm:
        <select
          value={reasonCategory}
          onChange={(e) => setReasonCategory(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-line bg-white p-3 text-sm focus-visible:outline-2 focus-visible:outline-primary"
        >
          <option value="INACCURATE_INFO">Thông tin phòng không đúng thực tế</option>
          <option value="FAKE_DEPOSIT">Nghi vấn lừa đảo / yêu cầu cọc mập mờ</option>
          <option value="PRICE_DISCREPANCY">Giá cho thuê sai lệch so với tin đăng</option>
          <option value="DUPLICATE_OR_EXPIRED">Phòng đã cho thuê hoặc bài đăng trùng lặp</option>
          <option value="OTHER">Lý do vi phạm khác</option>
        </select>
      </label>

      <label className="block text-sm font-semibold">
        Mô tả chi tiết vi phạm:
        <textarea
          rows={3}
          required
          maxLength={1000}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Cung cấp thêm chi tiết để Admin kiểm tra nhanh chóng..."
          className="mt-1.5 w-full rounded-xl border border-line p-3 text-sm focus-visible:outline-2 focus-visible:outline-primary"
        />
      </label>

      <div className="flex justify-end gap-2 pt-2">
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy
          </Button>
        )}
        <Button type="submit" variant="danger" disabled={busy}>
          {busy ? 'Đang gửi…' : user ? 'Gửi báo cáo vi phạm' : 'Đăng nhập để báo cáo'}
        </Button>
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </form>
  );
}
