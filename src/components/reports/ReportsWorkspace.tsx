'use client';
import { useCallback, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useApiData } from '@/hooks/useApiData';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import { EMPTY_REPORTS, listAdminReports, listMyReports, REPORTS_EVENT, REPORT_STATUS_LABELS, reviewReport, type ReportStatus, type ViolationReport } from '@/services/backend/reports';

const targetLabels = { USER: 'Người dùng', POST: 'Bài đăng', ROOM: 'Phòng' };
const date = (value: string) => new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Bangkok' });
export default function ReportsWorkspace({ admin = false }: { admin?: boolean }) {
  const { user, ready: authReady, openAuth } = useAuth();
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<ReportStatus | ''>('');
  const [selected, setSelected] = useState<ViolationReport | null>(null);
  const [notice, setNotice] = useState('');
  const load = useCallback(() => admin ? listAdminReports(page, filter || undefined) : listMyReports(page), [admin, page, filter]);
  const result = useApiData(`reports:${admin}:${page}:${filter}`, load, EMPTY_REPORTS, REPORTS_EVENT, 30000);
  if (!authReady) return <p role="status">Đang kiểm tra tài khoản…</p>;
  if (!user) return <div className="space-y-4 py-8"><h1 className="text-2xl font-bold">Báo cáo của tôi</h1><p>Đăng nhập để xem báo cáo đã gửi.</p><Button onClick={() => openAuth()}>Đăng nhập</Button></div>;
  if (admin && user.role !== 'ADMIN') return <p role="alert">Bạn không có quyền xử lý báo cáo.</p>;
  return <section className="space-y-5 pb-8">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5"><h1 className="text-2xl font-bold">{admin ? 'Báo cáo vi phạm' : 'Báo cáo của tôi'}</h1><Button size="sm" variant="outline" onClick={result.retry} disabled={!result.ready}>Tải lại</Button></header>
    {admin && <label className="block max-w-xs text-sm font-semibold">Trạng thái<select aria-label="Lọc trạng thái báo cáo" value={filter} onChange={(event) => { setFilter(event.target.value as ReportStatus | ''); setPage(0); }} className="mt-2 w-full rounded-xl border border-line bg-white p-3"><option value="">Tất cả</option>{Object.entries(REPORT_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}
    {notice && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
    {!result.ready ? <p role="status" className="py-8 text-muted">Đang tải báo cáo…</p> : result.error ? <div role="alert" className="space-y-3 rounded-xl bg-red-50 p-4 text-sm text-red-800"><p>{result.error}</p><Button size="sm" variant="outline" onClick={result.retry}>Thử lại</Button></div> : !result.data.content.length ? <p className="rounded-xl border border-line p-8 text-center text-muted">{filter ? 'Không có báo cáo ở trạng thái này.' : 'Chưa có báo cáo vi phạm.'}</p> : <div className="space-y-4">{result.data.content.map((report) => <article key={report.id} className="min-w-0 space-y-3 rounded-xl border border-line p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><h2 className="min-w-0 break-words font-bold">{report.reason}</h2><Badge tone={report.status === 'RESOLVED' ? 'green' : report.status === 'REJECTED' ? 'gray' : 'amber'}>{REPORT_STATUS_LABELS[report.status]}</Badge></div>
      <p className="text-xs text-muted">{targetLabels[report.targetType]} · <time dateTime={report.createdAt}>{date(report.createdAt)}</time></p>
      {report.description && <p className="whitespace-pre-wrap break-words text-sm leading-6">{report.description}</p>}
      {report.resolution && <div className="rounded-lg bg-page p-3 text-sm"><strong>Kết quả xử lý</strong><p className="mt-1 whitespace-pre-wrap break-words">{report.resolution}</p></div>}
      {report.reviewedAt && <p className="text-xs text-muted">Cập nhật xử lý: {date(report.reviewedAt)}</p>}
      <details className="text-xs text-muted"><summary className="cursor-pointer">Thông tin báo cáo</summary><dl className="mt-2 space-y-1 break-all"><div><dt className="inline font-semibold">Mã báo cáo: </dt><dd className="inline">{report.id}</dd></div><div><dt className="inline font-semibold">Đối tượng: </dt><dd className="inline">{report.targetId}</dd></div>{admin && <div><dt className="inline font-semibold">Người gửi: </dt><dd className="inline">{report.reporterId}</dd></div>}</dl></details>
      {admin && <Button size="sm" variant="outline" onClick={() => setSelected(report)}>Xử lý báo cáo</Button>}
    </article>)}</div>}
    {result.ready && !result.error && <Pagination page={page} totalPages={result.data.totalPages} totalElements={result.data.totalElements} onChange={setPage} />}
    <Modal open={!!selected} onClose={() => setSelected(null)} title="Xử lý báo cáo" widthClass="max-w-xl">{selected && <ReviewForm key={`${user.id}:${selected.id}`} report={selected} onDone={() => { setSelected(null); setNotice('Đã cập nhật kết quả xử lý báo cáo.'); }} />}</Modal>
  </section>;
}
function ReviewForm({ report, onDone }: { report: ViolationReport; onDone: () => void }) {
  const [status, setStatus] = useState<Exclude<ReportStatus, 'PENDING'>>(report.status === 'PENDING' ? 'REVIEWING' : report.status);
  const [resolution, setResolution] = useState(report.resolution ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await reviewReport(report.id, status, resolution); onDone(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể cập nhật báo cáo.'); }
    finally { lock.current = false; setBusy(false); }
  };
  return <form onSubmit={submit} className="space-y-4"><p className="text-sm font-semibold">{report.reason}</p><label className="block text-sm font-semibold">Trạng thái<select name="status" value={status} disabled={busy} onChange={(event) => setStatus(event.target.value as typeof status)} className="mt-2 w-full rounded-xl border border-line bg-white p-3">{(['REVIEWING', 'RESOLVED', 'REJECTED'] as const).map((value) => <option key={value} value={value}>{REPORT_STATUS_LABELS[value]}</option>)}</select></label><label className="block text-sm font-semibold">Kết quả xử lý<textarea name="resolution" maxLength={3000} rows={4} value={resolution} disabled={busy} onChange={(event) => setResolution(event.target.value)} className="mt-2 w-full rounded-xl border border-line p-3 text-sm" /></label>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<Button type="submit" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu kết quả'}</Button></form>;
}
