import { allPages } from './http';

export interface AuditLog {
  id: string;
  source: 'CORE' | 'RENTAL';
  userId?: string;
  action: string;
  entityName: string;
  entityId: string;
  ipAddress?: string;
  userAgent?: string;
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  createdAt: string;
}

export const AUDIT_LOG_EVENT = 'roomix:audit-logs';

export function listAuditLogs(action = '') {
  const filter = action.trim() ? `?action=${encodeURIComponent(action.trim())}` : '';
  return Promise.all([
    allPages<Omit<AuditLog, 'source'>>(`/api/admin/audit-logs${filter}`),
    allPages<Omit<AuditLog, 'source'>>(`/api/rentals/admin/audit-logs${filter}`),
  ]).then(([coreLogs, rentalLogs]) => [
    ...coreLogs.map((log) => ({ ...log, source: 'CORE' as const })),
    ...rentalLogs.map((log) => ({ ...log, source: 'RENTAL' as const })),
  ].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)));
}
