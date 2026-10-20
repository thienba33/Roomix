'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { reports as reportsData, posts } from '@/lib/data';
import { cn, formatVND } from '@/lib/utils';
import type { ReportItem } from '@/types';

type Severity = { label: string; tone: 'red' | 'amber' | 'gray' };

function severityOf(report: ReportItem): Severity {
  const r = report.reason.toLowerCase();
  if (r.includes('sai thông tin') || r.includes('giá')) return { label: 'Cao', tone: 'red' };
  if (r.includes('ảnh')) return { label: 'Trung bình', tone: 'amber' };
  if (report.id === 1) return { label: 'Cao', tone: 'red' };
  if (report.id === 2) return { label: 'Trung bình', tone: 'amber' };
  return { label: 'Thấp', tone: 'gray' };
}

function statusLabel(s: ReportItem['status']): string {
  if (s === 'PENDING') return 'Chờ xử lý';
  if (s === 'RESOLVED') return 'Đã xử lý';
  return 'Đã bỏ qua';
}

function statusTone(s: ReportItem['status']): 'amber' | 'green' | 'gray' {
  if (s === 'PENDING') return 'amber';
  if (s === 'RESOLVED') return 'green';
  return 'gray';
}

function targetPost(report: ReportItem) {
  // Extract room code like "303" / "510" from target text
  const m = report.target.match(/(\d{3})/);
  if (!m) return undefined;
  const code = m[1];
  return posts.find((p) => p.roomCode === code);
}

export default function ReportsPage() {
  const [list, setList] = useState<ReportItem[]>(reportsData);
  const [selectedId, setSelectedId] = useState<number>(reportsData[0]?.id ?? 1);

  const selected = useMemo(() => list.find((r) => r.id === selectedId) ?? list[0], [list, selectedId]);
  const selectedPost = selected ? targetPost(selected) : undefined;
  const pendingCount = list.filter((r) => r.status === 'PENDING').length;

  const markResolved = () => {
    if (!selected) return;
    setList((prev) => prev.map((r) => (r.id === selected.id ? { ...r, status: 'RESOLVED' as const } : r)));
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[26px] font-extrabold tracking-tight text-ink">Báo cáo vi phạm</h1>
        <p className="mt-1 text-sm text-muted">{pendingCount} báo cáo đang chờ xử lý</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        {/* LEFT — List */}
        <div className="space-y-3">
          {list.map((report) => {
            const sev = severityOf(report);
            const active = selected?.id === report.id;
            return (
              <button
                key={report.id}
                type="button"
                onClick={() => setSelectedId(report.id)}
                className="block w-full text-left"
              >
                <Card className={cn('p-4 transition hover:border-primary/40', active && 'border-primary ring-2 ring-primary/15')}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-bold text-ink">{report.reason}</p>
                      <p className="mt-1 truncate text-sm text-muted">{report.target}</p>
                      <p className="mt-0.5 text-[13px] text-muted">
                        Người báo cáo: {report.reporter} · {report.date}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <Badge tone={sev.tone} dot>{sev.label}</Badge>
                      <Badge tone={statusTone(report.status)}>{statusLabel(report.status)}</Badge>
                    </div>
                  </div>
                </Card>
              </button>
            );
          })}
        </div>

        {/* RIGHT — Detail */}
        {selected && (
          <div>
            <Card className="sticky top-24 p-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-bold leading-snug text-ink">{selected.reason}</h2>
                <Badge tone={severityOf(selected).tone} dot>{severityOf(selected).label}</Badge>
              </div>

              <dl className="mt-4 space-y-2.5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Người báo cáo</dt>
                  <dd className="font-medium text-ink">{selected.reporter}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Đối tượng</dt>
                  <dd className="text-right font-medium text-ink">{selected.target}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Ngày báo cáo</dt>
                  <dd className="font-medium text-ink">{selected.date}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Trạng thái</dt>
                  <dd><Badge tone={statusTone(selected.status)}>{statusLabel(selected.status)}</Badge></dd>
                </div>
              </dl>

              <div className="mt-5 border-t border-line pt-4">
                <p className="text-sm font-bold text-ink">Mô tả chi tiết</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/80">
                  {selected.detail ?? 'Người dùng cho biết nội dung bài đăng chưa đúng với thực tế và cần Admin kiểm tra lại trước khi tiếp tục hiển thị.'}
                </p>
              </div>

              {selectedPost && (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-page p-3">
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg">
                    <Image src={selectedPost.image} alt={selectedPost.title} fill className="object-cover" sizes="80px" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{selectedPost.title}</p>
                    <p className="text-[13px] text-muted">{formatVND(selectedPost.price)}/tháng · {selectedPost.area}</p>
                  </div>
                </div>
              )}

              <div className="mt-5 flex flex-col gap-2.5">
                <Button
                  variant="outline"
                  className="w-full border-red-300 text-red-600 hover:border-red-500 hover:text-red-700"
                >
                  Ẩn bài đăng
                </Button>
                <Button className="w-full" onClick={markResolved} disabled={selected.status === 'RESOLVED'}>
                  {selected.status === 'RESOLVED' ? 'Đã đánh dấu xử lý' : 'Đánh dấu đã xử lý'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
