'use client';

import { useCallback, useState } from 'react';
import { useApiData } from '@/hooks/useApiData';
import { AUDIT_LOG_EVENT, listAuditLogs, type AuditLog } from '@/services/backend/audit';

const EMPTY_LOGS: AuditLog[] = [];

function summarize(values: Record<string, unknown>) {
  const entries = Object.entries(values ?? {});
  if (!entries.length) return '—';
  return entries.map(([key, value]) => `${key}: ${String(value)}`).join(' · ');
}

export default function AuditLogsPage() {
  const [input, setInput] = useState('');
  const [action, setAction] = useState('');
  const load = useCallback(() => listAuditLogs(action), [action]);
  const logs = useApiData(`audit-logs:${action}`, load, EMPTY_LOGS, AUDIT_LOG_EVENT);

  return <section className="space-y-6">
    <header>
      <h1 className="text-2xl font-bold">Nhật ký hệ thống</h1>
      <p className="mt-1 text-sm text-muted">Theo dõi người thực hiện, đối tượng và dữ liệu thay đổi của các nghiệp vụ quan trọng.</p>
    </header>

    <form className="flex max-w-xl gap-2" onSubmit={(event) => { event.preventDefault(); setAction(input); }}>
      <label className="sr-only" htmlFor="audit-action">Tìm theo hành động</label>
      <input id="audit-action" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ví dụ: APPROVE_POST, LOCK_USER" className="min-w-0 flex-1 rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none focus:border-primary" />
      <button className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white" type="submit">Tìm kiếm</button>
      {action && <button type="button" className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold" onClick={() => { setInput(''); setAction(''); }}>Xóa lọc</button>}
    </form>

    {!logs.ready && <p role="status">Đang tải nhật ký…</p>}
    {logs.error && <p role="alert" className="text-red-700">{logs.error}</p>}
    {logs.ready && !logs.error && !logs.data.length && <p className="rounded-xl border border-line bg-white p-6 text-sm text-muted">Chưa có nhật ký phù hợp.</p>}
    {logs.ready && !logs.error && logs.data.length > 0 && <div className="overflow-x-auto rounded-xl border border-line bg-white">
      <table className="w-full min-w-[1080px] text-left text-sm">
        <thead className="border-b border-line bg-page text-xs uppercase tracking-wide text-muted"><tr><th className="px-4 py-3">Thời gian</th><th className="px-4 py-3">Dịch vụ</th><th className="px-4 py-3">Hành động</th><th className="px-4 py-3">Người thực hiện</th><th className="px-4 py-3">Đối tượng</th><th className="px-4 py-3">Thay đổi</th><th className="px-4 py-3">IP</th></tr></thead>
        <tbody className="divide-y divide-line">{logs.data.map((log) => <tr key={log.id} className="align-top hover:bg-page/60">
          <td className="whitespace-nowrap px-4 py-4">{new Date(log.createdAt).toLocaleString('vi-VN')}</td>
          <td className="px-4 py-4"><span className="rounded-full bg-page px-2 py-1 text-xs font-semibold">{log.source === 'CORE' ? 'Core' : 'Rental'}</span></td>
          <td className="px-4 py-4 font-semibold text-primary">{log.action}</td>
          <td className="px-4 py-4"><span className="font-mono text-xs">{log.userId || 'Hệ thống/VNPay'}</span></td>
          <td className="px-4 py-4"><strong>{log.entityName}</strong><span className="mt-1 block font-mono text-xs text-muted">{log.entityId}</span></td>
          <td className="max-w-md px-4 py-4 text-xs leading-5"><span className="block text-muted">Trước: {summarize(log.oldValues)}</span><span className="mt-1 block">Sau: {summarize(log.newValues)}</span></td>
          <td className="whitespace-nowrap px-4 py-4 text-muted">{log.ipAddress || '—'}</td>
        </tr>)}</tbody>
      </table>
    </div>}
  </section>;
}
