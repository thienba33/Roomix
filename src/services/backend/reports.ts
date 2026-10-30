import { api, emit, post, type ApiPage } from './http';
import { readSession } from './session';
export type ReportStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'REJECTED';
export type ReportTarget = 'USER' | 'POST' | 'ROOM';
export interface ViolationReport {
  id: string; reporterId: string; targetType: ReportTarget; targetId: string;
  reason: string; description?: string | null; status: ReportStatus; resolution?: string | null;
  reviewedBy?: string | null; reviewedAt?: string | null; createdAt: string; updatedAt: string;
}
export const REPORTS_EVENT = 'roomix:reports-api';
export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  PENDING: 'Chờ xử lý', REVIEWING: 'Đang xem xét', RESOLVED: 'Đã xử lý', REJECTED: 'Từ chối',
};
export const EMPTY_REPORTS: ApiPage<ViolationReport> = { content: [], totalPages: 0, totalElements: 0, last: true };
export async function createReport(input: { targetType: ReportTarget; targetId: string; reason: string; description?: string }) {
  if (!readSession()) throw new Error('Đăng nhập để gửi báo cáo.');
  if (!/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(input.targetId)) throw new Error('Không xác định được đối tượng báo cáo.');
  if (!input.reason.trim() || input.reason.trim().length > 200 || (input.description?.length ?? 0) > 3000) throw new Error('Lý do tối đa 200 ký tự, mô tả tối đa 3.000 ký tự.');
  const result = await post<ViolationReport>('/api/reports', { ...input, reason: input.reason.trim(), description: input.description?.trim() || undefined });
  emit(REPORTS_EVENT);
  return result;
}
export function listMyReports(page = 0) {
  return readSession() ? api<ApiPage<ViolationReport>>(`/api/reports/mine?page=${page}&size=20&sort=createdAt,desc`) : Promise.resolve(EMPTY_REPORTS);
}
export function listAdminReports(page = 0, status?: ReportStatus) {
  if (readSession()?.user.role !== 'ADMIN') return Promise.resolve(EMPTY_REPORTS);
  const params = new URLSearchParams({ page: String(page), size: '20', sort: 'createdAt,desc' });
  if (status) params.set('status', status);
  return api<ApiPage<ViolationReport>>(`/api/admin/reports?${params}`);
}
export async function reviewReport(id: string, status: Exclude<ReportStatus, 'PENDING'>, resolution: string) {
  if (resolution.length > 3000) throw new Error('Kết quả xử lý tối đa 3.000 ký tự.');
  const result = await post<ViolationReport>(`/api/admin/reports/${encodeURIComponent(id)}/review`, { status, resolution: resolution.trim() });
  emit(REPORTS_EVENT);
  return result;
}
