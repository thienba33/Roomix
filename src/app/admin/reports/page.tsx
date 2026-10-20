'use client';

import { useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { appendAudit, useAdminReports, useAuditExtra } from '@/lib/admin-store';
import { cn } from '@/lib/utils';
import type { ReportItem } from '@/types';

function badgeForStatus(s: ReportItem['status']): { tone: 'red' | 'green' | 'gray'; label: string } {
  if (s === 'PENDING') return { tone: 'red', label: 'Chưa xử lý' };
  if (s === 'RESOLVED') return { tone: 'green', label: 'Đã xử lý' };
  return { tone: 'gray', label: 'Đã đóng' };
}

function roomCodeOf(report: ReportItem): string | undefined {
  const m = report.target.match(/\d{3}/);
  return m ? m[0] : undefined;
}

type PendingAction = 'takedown' | 'dismiss' | null;

// C5 · UC07.6 (+ UC04.9 takedown) — fully functional at MOCK level only:
// UC07.6 has NO backend module (no entity/controller/DTO), so every status
// here is a frontend invention persisted to the admin store. Both actions
// sit behind ConfirmDialog and can be undone while the report was PENDING.
export default function ReportsPage() {
  const { push } = useToast();
  const [list, setList] = useAdminReports();
  const [, setAuditExtra] = useAuditExtra();
  const [selectedId, setSelectedId] = useState<number>(list[0]?.id ?? 1);
  const [action, setAction] = useState<PendingAction>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | ReportItem['status']>('all');

  const filtered = useMemo(
    () => (statusFilter === 'all' ? list : list.filter((r) => r.status === statusFilter)),
    [list, statusFilter],
  );
  const selected = useMemo(
    () => list.find((r) => r.id === selectedId) ?? filtered[0] ?? list[0],
    [list, selectedId, filtered],
  );
  const pendingCount = list.filter((r) => r.status === 'PENDING').length;

  const setStatus = (id: number, status: ReportItem['status']) =>
    setList((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));

  const confirmAction = () => {
    if (!selected || !action) return;
    const target = selected;
    const prevStatus = target.status;
    if (action === 'takedown') {
      setStatus(target.id, 'RESOLVED');
      appendAudit(setAuditExtra, 'Gỡ bài đăng (báo cáo)', target.target);
      push('Đã xử lý báo cáo — gỡ bài đăng', target.target, {
        label: 'Hoàn tác',
        onClick: () => setStatus(target.id, prevStatus),
      });
    } else {
      setStatus(target.id, 'DISMISSED');
      appendAudit(setAuditExtra, 'Đóng báo cáo', target.target);
      push('Đã đóng báo cáo · Không vi phạm', target.target, {
        label: 'Hoàn tác',
        onClick: () => setStatus(target.id, prevStatus),
      });
    }
  };

  const chip = (active: boolean) =>
    cn('h-7 rounded-full px-3 text-xs font-medium', active ? 'bg-primary-soft text-primary' : 'bg-[#F7F7F7] text-muted');

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Báo cáo vi phạm</h1>
      <p className="mt-1 text-sm text-muted">{pendingCount} báo cáo đang mở · Hiển thị {filtered.length} / {list.length}</p>
      <p className="mt-1 text-[13px] font-medium text-amber-700">Chế độ mô phỏng — UC07.6 chưa có module backend.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setStatusFilter('all')} className={chip(statusFilter === 'all')}>Tất cả · {list.length}</button>
        <button type="button" onClick={() => setStatusFilter('PENDING')} className={chip(statusFilter === 'PENDING')}>Chưa xử lý · {pendingCount}</button>
        <button type="button" onClick={() => setStatusFilter('RESOLVED')} className={chip(statusFilter === 'RESOLVED')}>Đã xử lý · {list.filter((r) => r.status === 'RESOLVED').length}</button>
        <button type="button" onClick={() => setStatusFilter('DISMISSED')} className={chip(statusFilter === 'DISMISSED')}>Đã đóng · {list.filter((r) => r.status === 'DISMISSED').length}</button>
      </div>

      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[1fr_456px]">
        <Card className="divide-y divide-line overflow-hidden p-0">
          {filtered.map((report) => {
            const badge = badgeForStatus(report.status);
            const code = roomCodeOf(report);
            const active = selected?.id === report.id;
            return (
              <button
                key={report.id}
                type="button"
                onClick={() => setSelectedId(report.id)}
                className={cn('w-full px-5 py-5 text-left', active && 'bg-primary-soft/40')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{report.reason}</p>
                    <p className="mt-1 text-[13px] text-muted">
                      {code ? `Phòng ${code} · khách ${report.reporter} · ${report.date}` : `${report.target} · khách ${report.reporter} · ${report.date}`}
                    </p>
                  </div>
                  <Badge tone={badge.tone}>{badge.label}</Badge>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && <p className="px-5 py-8 text-center text-sm text-muted">Không có báo cáo nào ở trạng thái này.</p>}
        </Card>

        {selected && (
          <Card className="p-6">
            <h2 className="text-[17px] font-semibold text-ink">Chi tiết báo cáo</h2>
            <p className="mt-4 font-medium text-ink">
              {selected.reason} — {selected.target}
            </p>
            <p className="mt-1 text-[13px] text-muted">Người báo cáo: {selected.reporter} · {selected.date}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {selected.detail ?? 'Người dùng cho biết nội dung bài đăng chưa đúng với thực tế và cần Admin kiểm tra lại trước khi tiếp tục hiển thị.'}
            </p>
            {selected.status === 'PENDING' ? (
              <div className="mt-6 space-y-2.5">
                <Button className="w-full" onClick={() => setAction('takedown')}>
                  Gỡ bài đăng
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setAction('dismiss')}>
                  Đóng báo cáo · Không vi phạm
                </Button>
              </div>
            ) : (
              <div className="mt-6 space-y-2.5">
                <Badge tone={badgeForStatus(selected.status).tone}>{badgeForStatus(selected.status).label}</Badge>
                <Button variant="outline" className="w-full" onClick={() => setStatus(selected.id, 'PENDING')}>
                  Mở lại báo cáo
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={action === 'takedown'}
        title="Gỡ bài đăng bị báo cáo?"
        description={selected ? `Bài đăng trong “${selected.target}” sẽ bị gỡ khỏi hiển thị và báo cáo được đánh dấu đã xử lý. Lưu ý: backend chưa có endpoint gỡ bài (UC04.9) lẫn module báo cáo (UC07.6) — đây là thao tác mô phỏng, có thể hoàn tác.` : ''}
        confirmLabel="Gỡ bài đăng"
        danger
        onConfirm={confirmAction}
        onCancel={() => setAction(null)}
      />
      <ConfirmDialog
        open={action === 'dismiss'}
        title="Đóng báo cáo — không vi phạm?"
        description={selected ? `Báo cáo “${selected.reason} — ${selected.target}” sẽ được đóng với kết luận không vi phạm. Bài đăng giữ nguyên hiển thị. Thao tác có thể hoàn tác.` : ''}
        confirmLabel="Đóng báo cáo"
        onConfirm={confirmAction}
        onCancel={() => setAction(null)}
      />
    </div>
  );
}
