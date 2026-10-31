import { allPages, emit, post } from './http';

export type ReportStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'REJECTED';
export type ReportTargetType = 'USER' | 'POST' | 'ROOM';

export interface ViolationReport {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  description?: string | null;
  status: ReportStatus;
  resolution?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const REPORTS_EVENT = 'roomix:reports';

export const listAdminReports = () =>
  allPages<ViolationReport>('/api/admin/reports?sort=createdAt,desc');

export async function createReport(input: {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  description: string;
}) {
  const report = await post<ViolationReport>('/api/reports', input);
  emit(REPORTS_EVENT);
  emit('roomix:admin-dashboard');
  return report;
}

export async function reviewReport(id: string, status: Exclude<ReportStatus, 'PENDING'>, resolution: string) {
  const report = await post<ViolationReport>(`/api/admin/reports/${id}/review`, { status, resolution });
  emit(REPORTS_EVENT);
  emit('roomix:admin-dashboard');
  return report;
}
