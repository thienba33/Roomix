'use client';
import { useApiData } from './useApiData';
import { listNotifications, unreadCount, NOTIFICATIONS_EVENT, type Notification } from '@/services/backend/notifications';
const EMPTY: Notification[] = [];
export function useNotifications() {
  const { data: items, ...state } = useApiData('notifications', listNotifications, EMPTY, NOTIFICATIONS_EVENT, 30000);
  return { items, unread: items.filter((item) => !item.read).length, ...state };
}
export function useUnreadNotifications() {
  const { data: unread, ...state } = useApiData('unread-notifications', unreadCount, 0, NOTIFICATIONS_EVENT, 30000);
  return { unread, ...state };
}
