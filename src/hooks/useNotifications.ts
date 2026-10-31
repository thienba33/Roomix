'use client';
import { useEffect } from 'react';
import { useApiData } from './useApiData';
import { listNotifications, NOTIFICATIONS_EVENT, subscribeNotificationStream, type Notification } from '@/services/backend/notifications';
import { readSession } from '@/services/backend/session';
const EMPTY: Notification[] = [];
export function useNotifications() {
  const token = readSession()?.accessToken;
  useEffect(() => token ? subscribeNotificationStream() : undefined, [token]);
  const { data: items, ...state } = useApiData('notifications', listNotifications, EMPTY, NOTIFICATIONS_EVENT, 60_000);
  return { items, unread: items.filter((item) => !item.read).length, ...state };
}
