'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import StatusFilter from '@/components/rental/StatusFilter';
import { useApiData } from '@/hooks/useApiData';
import {
  listAdminReports,
  REPORTS_EVENT,
  reviewReport,
  type ReportStatus,
  type ViolationReport,
} from '@/services/backend/reports';

const EMPTY_REPORTS: ViolationReport[] = [];
const REASON_NAMES: Record<string, string> = {
  INACCURATE_INFO: 'Thông tin không đúng thực tế',
  FAKE_DEPOSIT: 'Nghi vấn cọc ảo / lừa đảo',
  PRICE_DISCREPANCY: 'Sai lệch giá cho thuê',
  DUPLICATE_OR_EXPIRED: 'Tin trùng lặp / đã cho thuê',
  OTHER: 'Vi phạm khác',
};
const STATUS_NAMES: Record<ReportStatus, string> = {
  PENDING: 'Chờ xử lý',
  REVIEWING: 'Đang xác minh',
  RESOLVED: 'Đã xử lý',
  REJECTED: 'Không vi phạm',
};
const TARGET_NAMES = { USER: 'Người dùng', POST: 'Bài đăng', ROOM: 'Phòng' };

function statusTone(status: ReportStatus): 'red' | 'amber' | 'green' | 'gray' {
  if (status === 'PENDING') return 'red';
  if (status === 'REVIEWING') return 'amber';
  if (status === 'RESOLVED') return 'green';
  return 'gray';
}

export default function AdminReportsPage() {
  const loadReports = useCallback(() => listAdminReports(), []);
  const { data: reports, ready, error, retry } = useApiData(
    'admin-reports',
    loadReports,
    EMPTY_REPORTS,
    REPORTS_EVENT,
  );
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [filter, setFilter] = useState('ALL');

  const updateStatus = async (
    report: ViolationReport,
    status: Exclude<ReportStatus, 'PENDING'>,
  ) => {
    setBusyId(report.id);
    setNotice('');
    setActionError('');
    try {
      const resolution =
        status === 'REVIEWING'
          ? 'Admin đã tiếp nhận và đang xác minh báo cáo.'
          : status === 'RESOLVED'
            ? 'Đã xác minh vi phạm và hoàn tất xử lý.'
            : 'Đã xác minh nhưng không phát hiện vi phạm.';
      await reviewReport(report.id, status, resolution);
      setNotice(`Đã chuyển báo cáo sang trạng thái “${STATUS_NAMES[status]}”.`);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Không thể cập nhật báo cáo.');
    } finally {
      setBusyId('');
    }
  };

  const visible = reports.filter((report) => filter === 'ALL' || report.status === filter);

  return (
    <div className="admin-reports space-y-6 pb-8">
      <header className="border-b border-line pb-6">
        <h1 className="text-[28px] font-extrabold tracking-tight sm:text-[32px]">
          Quản lý báo cáo vi phạm
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Tiếp nhận, xác minh và xử lý phản ánh của người dùng. Dữ liệu được tải trực tiếp từ Core Service.
        </p>
      </header>

      <StatusFilter
        label="Lọc báo cáo"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'ALL', label: 'Tất cả', count: reports.length },
          { value: 'PENDING', label: 'Chờ xử lý', count: reports.filter((r) => r.status === 'PENDING').length },
          { value: 'REVIEWING', label: 'Đang xác minh', count: reports.filter((r) => r.status === 'REVIEWING').length },
          { value: 'RESOLVED', label: 'Đã xử lý', count: reports.filter((r) => r.status === 'RESOLVED').length },
          { value: 'REJECTED', label: 'Không vi phạm', count: reports.filter((r) => r.status === 'REJECTED').length },
        ]}
      />

      {notice && (
        <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-800">
          {notice}
        </p>
      )}
      {actionError && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {actionError}
        </p>
      )}

      {!ready ? (
        <div role="status" className="rounded-2xl border border-line bg-white p-8 text-center text-muted">
          Đang tải báo cáo vi phạm…
        </div>
      ) : error ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p>{error}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={retry}>
            Thử lại
          </Button>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-8 text-center text-muted">
          {filter === 'ALL' ? 'Chưa có báo cáo vi phạm.' : 'Không có báo cáo ở trạng thái này.'}
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((report) => (
            <article key={report.id} className="space-y-3 rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                    {REASON_NAMES[report.reason] || report.reason}
                  </span>
                  <h2 className="mt-1 text-base font-bold text-ink">
                    {TARGET_NAMES[report.targetType] || report.targetType} bị báo cáo
                  </h2>
                  <p className="break-all text-xs text-muted">
                    Mã đối tượng:{' '}
                    {report.targetType === 'ROOM' ? (
                      <Link href={`/rooms/${report.targetId}`} className="text-primary hover:underline">
                        {report.targetId}
                      </Link>
                    ) : (
                      report.targetId
                    )}
                  </p>
                  <p className="mt-1 break-all text-xs text-muted">
                    Người gửi: {report.reporterId} · {new Date(report.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                <Badge tone={statusTone(report.status)} dot>
                  {STATUS_NAMES[report.status] || report.status}
                </Badge>
              </div>

              <div className="rounded-xl bg-page p-3 text-sm leading-6">
                <span className="mb-1 block text-xs font-semibold text-muted">Nội dung phản ánh</span>
                {report.description || 'Người dùng không cung cấp mô tả chi tiết.'}
              </div>

              {report.resolution && (
                <p className="rounded-xl border border-line p-3 text-sm text-muted">
                  <strong className="text-ink">Kết quả xử lý:</strong> {report.resolution}
                </p>
              )}

              {(report.status === 'PENDING' || report.status === 'REVIEWING') && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {report.status === 'PENDING' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === report.id}
                      onClick={() => updateStatus(report, 'REVIEWING')}
                    >
                      Tiếp nhận xác minh
                    </Button>
                  )}
                  <Button
                    size="sm"
                    disabled={busyId === report.id}
                    onClick={() => updateStatus(report, 'RESOLVED')}
                  >
                    Xác nhận vi phạm
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === report.id}
                    onClick={() => updateStatus(report, 'REJECTED')}
                  >
                    Không phát hiện vi phạm
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
