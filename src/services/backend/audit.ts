import { api, type ApiPage } from './http';
import { readSession } from './session';
export interface AuditLog {
  id: string; userId: string | null; action: string; entityName: string; entityId: string;
  ipAddress?: string | null; userAgent?: string | null;
  oldValues?: Record<string, unknown> | null; newValues?: Record<string, unknown> | null; createdAt: string;
}
export const EMPTY_AUDIT: ApiPage<AuditLog> = { content: [], totalPages: 0, totalElements: 0, last: true };
export function listAuditLogs(page = 0, action = '') {
  if (readSession()?.user.role !== 'ADMIN') return Promise.resolve(EMPTY_AUDIT);
  const params = new URLSearchParams({ page: String(page), size: '20', sort: 'createdAt,desc' });
  if (action.trim()) params.set('action', action.trim());
  return api<ApiPage<AuditLog>>(`/api/admin/audit-logs?${params}`);
}
