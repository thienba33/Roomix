import { api, allPages, emit } from './http';
import { readSession } from './session';
import type { NotificationType } from '@/types';
export interface Notification {
  id: string; userId: string; title: string; content: string; type: NotificationType;
  referenceId?: string; read: boolean; createdAt: string;
}
export const NOTIFICATIONS_EVENT = 'roomix:notifications';
export async function listNotifications() { return readSession() ? allPages<Notification>('/api/notifications?sort=createdAt,desc') : []; }
export async function unreadCount() { return readSession() ? (await api<{ unreadCount: number }>('/api/notifications/unread-count')).unreadCount : 0; }
export async function markRead(id: string) { await api(`/api/notifications/${id}/read`, { method: 'PATCH' }); emit(NOTIFICATIONS_EVENT); }
export async function markAllRead() { await api('/api/notifications/read-all', { method: 'PATCH' }); emit(NOTIFICATIONS_EVENT); }
