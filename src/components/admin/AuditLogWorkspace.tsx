'use client';
import { useCallback, useState, type FormEvent } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useApiData } from '@/hooks/useApiData';
import { AUDIT_LOG_EVENT, EMPTY_AUDIT, listAuditLogs } from '@/services/backend/audit';
import { redactAuditValues } from '@/lib/audit-values';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Pagination from '@/components/ui/Pagination';

const LABELS: Record<string, string> = { CREATE_REPORT: 'Gửi báo cáo', REVIEW_REPORT: 'Xử lý báo cáo', LOCK_USER: 'Khóa tài khoản', UNLOCK_USER: 'Mở khóa tài khoản', APPROVE_POST: 'Duyệt tin', REJECT_POST: 'Từ chối tin', APPROVE_LANDLORD: 'Duyệt chủ trọ', REJECT_LANDLORD: 'Từ chối chủ trọ' };
export default function AuditLogWorkspace() {
  const { user, ready } = useAuth();
  const [page, setPage] = useState(0);
  const [input, setInput] = useState('');
  const [action, setAction] = useState('');
  const load = useCallback(() => listAuditLogs(page, action), [page, action]);
  const result = useApiData(`audit:${page}:${action}`, load, EMPTY_AUDIT, AUDIT_LOG_EVENT);
  const filter = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setAction(input.trim()); setPage(0); result.retry(); };
  if (!ready) return <p role="status">Đang kiểm tra tài khoản…</p>;
  if (user?.role !== 'ADMIN') return <p role="alert">Chỉ quản trị viên mới xem được nhật ký hoạt động.</p>;
  return <section className="space-y-5 pb-8"><header className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5"><h1 className="text-2xl font-bold">Nhật ký hoạt động</h1><Button size="sm" variant="outline" onClick={result.retry} disabled={!result.ready}>Tải lại</Button></header>
    <form onSubmit={filter} className="flex flex-wrap items-end gap-3"><div className="min-w-0 flex-1 sm:max-w-md"><Input label="Lọc hành động" name="action" value={input} maxLength={100} placeholder="Ví dụ: CREATE_REPORT, LOCK_USER…" onChange={(event) => setInput(event.target.value)} /></div><Button type="submit">Lọc</Button>{action && <Button type="button" variant="outline" onClick={() => { setInput(''); setAction(''); setPage(0); }}>Xóa lọc</Button>}</form>
    {!result.ready ? <p role="status" className="py-8 text-muted">Đang tải nhật ký…</p> : result.error ? <div role="alert" className="space-y-3 rounded-xl bg-red-50 p-4 text-sm text-red-800"><p>{result.error}</p><Button size="sm" variant="outline" onClick={result.retry}>Thử lại</Button></div> : !result.data.content.length ? <p className="rounded-xl border border-line p-8 text-center text-muted">Không có hoạt động phù hợp.</p> : <ol className="divide-y divide-line rounded-xl border border-line">{result.data.content.map((entry) => <li key={`${entry.source}:${entry.id}`} className="min-w-0 space-y-3 p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-2"><h2 className="font-bold">{LABELS[entry.action] ?? entry.action}</h2><time className="text-xs text-muted" dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Bangkok' })}</time></div><p className="break-all text-sm text-muted"><span className="mr-2 rounded-full bg-page px-2 py-1 text-xs font-semibold">{entry.source === 'CORE' ? 'Core' : 'Rental'}</span>{entry.entityName} · {entry.entityId}</p><p className="break-all text-xs text-muted">Người thực hiện: {entry.userId ?? 'Hệ thống'}</p><details className="text-sm"><summary className="cursor-pointer font-semibold text-primary">Chi tiết thay đổi</summary><div className="mt-3 grid gap-3 sm:grid-cols-2">{[['Trước', entry.oldValues], ['Sau', entry.newValues]].map(([label, value]) => <div key={String(label)} className="min-w-0 rounded-lg bg-page p-3"><h3 className="mb-2 text-xs font-semibold">{String(label)}</h3><pre className="whitespace-pre-wrap break-all text-xs leading-5">{JSON.stringify(redactAuditValues(value ?? {}), null, 2)}</pre></div>)}</div><p className="mt-3 break-all text-xs text-muted">Hành động: {entry.action}{entry.ipAddress ? ` · IP: ${entry.ipAddress}` : ''}</p></details></li>)}</ol>}
    {result.ready && !result.error && <Pagination page={page} totalPages={result.data.totalPages} totalElements={result.data.totalElements} onChange={setPage} />}
  </section>;
}
