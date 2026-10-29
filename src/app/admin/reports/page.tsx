'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface ReportItem {
  id: string;
  roomId: string;
  roomTitle: string;
  category: string;
  details: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
}

const CATEGORY_NAMES: Record<string, string> = {
  INACCURATE_INFO: 'Thông tin không đúng thực tế',
  FAKE_DEPOSIT: 'Nghi vấn cọc ảo / lừa đảo',
  PRICE_DISCREPANCY: 'Sai lệch giá cho thuê',
  DUPLICATE_OR_EXPIRED: 'Tin trùng lặp / đã cho thuê',
  OTHER: 'Vi phạm khác',
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [notice, setNotice] = useState('');

  const loadReports = () => {
    try {
      const stored: ReportItem[] = JSON.parse(localStorage.getItem('roomix:reports') || '[]');
      if (stored.length === 0) {
        // Seed initial sample report for realistic review
        const initial: ReportItem[] = [
          {
            id: 'rep-sample-1',
            roomId: 'room-demo-1',
            roomTitle: 'Phòng trọ cao cấp gần trường ĐH Tôn Đức Thắng',
            category: 'PRICE_DISCREPANCY',
            details: 'Chủ trọ báo giá thực tế cao hơn 500k so với bài đăng khi tới xem trực tiếp.',
            status: 'PENDING',
            createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          },
        ];
        localStorage.setItem('roomix:reports', JSON.stringify(initial));
        setReports(initial);
      } else {
        setReports(stored);
      }
    } catch {
      setReports([]);
    }
  };

  useEffect(() => {
    const loadTimer = window.setTimeout(loadReports, 0);

    return () => window.clearTimeout(loadTimer);
  }, []);

  const handleStatusChange = (id: string, newStatus: ReportItem['status']) => {
    const updated = reports.map((r) => (r.id === id ? { ...r, status: newStatus } : r));
    setReports(updated);
    localStorage.setItem('roomix:reports', JSON.stringify(updated));
    setNotice(newStatus === 'RESOLVED' ? 'Đã đánh dấu đã xử lý báo cáo vi phạm.' : 'Đã bỏ qua báo cáo.');
  };

  return (
    <div className="admin-reports space-y-6 pb-8">
      <header className="border-b border-line pb-6">
        <h1 className="text-[28px] font-extrabold tracking-tight sm:text-[32px]">Báo cáo vi phạm</h1>
      </header>

      {notice && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-800">{notice}</p>}

      {reports.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-8 text-center text-muted">
          Hiện chưa có báo cáo vi phạm nào từ người dùng.
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <article key={report.id} className="rounded-2xl border border-line bg-white p-5 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold text-red-600">
                    {CATEGORY_NAMES[report.category] || report.category}
                  </span>
                  <h3 className="mt-1 text-base font-bold text-ink">
                    {report.roomTitle}
                  </h3>
                  <p className="text-xs text-muted">
                    Mã phòng: <Link href={`/rooms/${report.roomId}`} className="text-primary hover:underline">{report.roomId}</Link> · Gửi lúc: {new Date(report.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                <Badge
                  tone={report.status === 'PENDING' ? 'red' : report.status === 'RESOLVED' ? 'green' : 'gray'}
                  dot
                >
                  {report.status === 'PENDING' ? 'Chờ xử lý' : report.status === 'RESOLVED' ? 'Đã xử lý' : 'Đã bỏ qua'}
                </Badge>
              </div>

              <div className="rounded-xl bg-page p-3 text-sm leading-6">
                <span className="font-semibold text-muted text-xs block mb-1">Nội dung phản ánh</span>
                {report.details}
              </div>

              {report.status === 'PENDING' && (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={() => handleStatusChange(report.id, 'RESOLVED')}>
                    Đánh dấu đã xử lý
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(report.id, 'DISMISSED')}>
                    Bỏ qua
                  </Button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
