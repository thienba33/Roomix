'use client';

import { useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { reports as reportsData } from '@/lib/data';
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

export default function ReportsPage() {
  const [list, setList] = useState<ReportItem[]>(reportsData);
  const [selectedId, setSelectedId] = useState<number>(reportsData[0]?.id ?? 1);

  const selected = useMemo(() => list.find((r) => r.id === selectedId) ?? list[0], [list, selectedId]);
  const pendingCount = list.filter((r) => r.status === 'PENDING').length;

  const markResolved = () => {
    if (!selected) return;
    setList((prev) => prev.map((r) => (r.id === selected.id ? { ...r, status: 'RESOLVED' as const } : r)));
  };

  const markDismissed = () => {
    if (!selected) return;
    setList((prev) => prev.map((r) => (r.id === selected.id ? { ...r, status: 'DISMISSED' as const } : r)));
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Báo cáo vi phạm</h1>
      <p className="mt-1 text-sm text-muted">{pendingCount} báo cáo đang mở</p>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_456px]">
        {/* LEFT — List */}
        <Card className="divide-y divide-line overflow-hidden p-0">
          {list.map((report) => {
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
                      {code ? `Phòng ${code} · khách ${report.reporter}` : `khách ${report.reporter}`}
                    </p>
                  </div>
                  <Badge tone={badge.tone}>{badge.label}</Badge>
                </div>
              </button>
            );
          })}
        </Card>

        {/* RIGHT — Detail */}
        {selected && (
          <Card className="p-6">
            <h2 className="text-[17px] font-semibold text-ink">Chi tiết báo cáo</h2>
            <p className="mt-4 font-medium text-ink">
              {selected.reason} — {selected.target}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {selected.detail ?? 'Người dùng cho biết nội dung bài đăng chưa đúng với thực tế và cần Admin kiểm tra lại trước khi tiếp tục hiển thị.'}
            </p>
            <div className="mt-6 space-y-2.5">
              <Button className="w-full" onClick={markResolved}>
                Gỡ bài đăng
              </Button>
              <Button variant="outline" className="w-full" onClick={markDismissed}>
                Đóng báo cáo · Không vi phạm
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
