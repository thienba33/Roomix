'use client';
import { useEffect } from 'react';
import { useApiData } from './useApiData';
import {
  listNotifications,
  unreadCount,
  NOTIFICATIONS_EVENT,
  subscribeNotificationStream,
  type Notification,
} from '@/services/backend/notifications';
import { readSession } from '@/services/backend/session';
const EMPTY: Notification[] = [];

function useNotificationStream() {
  const token = readSession()?.accessToken;
  useEffect(() => (token ? subscribeNotificationStream() : undefined), [token]);
}

export function useNotifications() {
  useNotificationStream();
  const { data: items, ...state } = useApiData('notifications', listNotifications, EMPTY, NOTIFICATIONS_EVENT, 30000);
  return { items, unread: items.filter((item) => !item.read).length, ...state };
}
export function useUnreadNotifications() {
  useNotificationStream();
  const { data: unread, ...state } = useApiData('unread-notifications', unreadCount, 0, NOTIFICATIONS_EVENT, 30000);
  return { unread, ...state };
}
