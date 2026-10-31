import { allPages, type ApiPage } from './http';
import { readSession } from './session';

export type AuditSource = 'CORE' | 'RENTAL';

export interface AuditLog {
  id: string;
  source: AuditSource;
  userId: string | null;
  action: string;
  entityName: string;
  entityId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  createdAt: string;
}

type ServiceAuditLog = Omit<AuditLog, 'source'>;

const PAGE_SIZE = 20;
export const AUDIT_LOG_EVENT = 'roomix:audit';
export const EMPTY_AUDIT: ApiPage<AuditLog> = {
  content: [],
  totalPages: 0,
  totalElements: 0,
  last: true,
};

export async function listAuditLogs(page = 0, action = ''): Promise<ApiPage<AuditLog>> {
  if (readSession()?.user.role !== 'ADMIN') return EMPTY_AUDIT;

  const filter = action.trim()
    ? `?action=${encodeURIComponent(action.trim())}`
    : '';
  const [coreLogs, rentalLogs] = await Promise.all([
    allPages<ServiceAuditLog>(`/api/admin/audit-logs${filter}`),
    allPages<ServiceAuditLog>(`/api/rentals/admin/audit-logs${filter}`),
  ]);
  const logs: AuditLog[] = [
    ...coreLogs.map((entry) => ({ ...entry, source: 'CORE' as const })),
    ...rentalLogs.map((entry) => ({ ...entry, source: 'RENTAL' as const })),
  ].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));

  const safePage = Math.max(0, page);
  const start = safePage * PAGE_SIZE;
  const totalPages = Math.ceil(logs.length / PAGE_SIZE);
  return {
    content: logs.slice(start, start + PAGE_SIZE),
    totalPages,
    totalElements: logs.length,
    last: totalPages === 0 || safePage + 1 >= totalPages,
  };
}
