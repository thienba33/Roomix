import { Client, type IMessage } from '@stomp/stompjs';
import { api, allPages, emit } from './http';
import { readSession } from './session';
import type { NotificationType } from '@/types';
export interface Notification {
  id: string; userId: string; title: string; content: string; type: NotificationType;
  event?: string; referenceId?: string; targetUrl?: string; read: boolean; readAt?: string; createdAt: string;
}
export const NOTIFICATIONS_EVENT = 'roomix:notifications';
export async function listNotifications() { return readSession() ? allPages<Notification>('/api/notifications?sort=createdAt,desc') : []; }
export async function unreadCount() { return readSession() ? (await api<{ unreadCount: number }>('/api/notifications/unread-count')).unreadCount : 0; }
export async function markRead(id: string) { await api(`/api/notifications/${id}/read`, { method: 'PATCH' }); emit(NOTIFICATIONS_EVENT); }
export async function markAllRead() { await api('/api/notifications/read-all', { method: 'PATCH' }); emit(NOTIFICATIONS_EVENT); }

let socketClient: Client | null = null;
let socketSubscribers = 0;

function websocketUrl() {
  const configured = process.env.NEXT_PUBLIC_WS_URL?.replace(/\/$/, '');
  if (configured) return configured.endsWith('/api/ws') ? configured : `${configured}/api/ws`;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.hostname}:18080/api/ws`;
}

function handleMessage(message: IMessage) {
  try {
    JSON.parse(message.body) as Notification;
  } catch {
    return;
  }
  emit(NOTIFICATIONS_EVENT);
  emit('roomix:admin-dashboard');
  emit('roomix:landlord-dashboard');
  emit('roomix:rental');
  emit('roomix:invoices');
}

export function subscribeNotificationStream() {
  const token = readSession()?.accessToken;
  if (!token) return () => undefined;
  socketSubscribers += 1;

  if (!socketClient) {
    socketClient = new Client({
      brokerURL: websocketUrl(),
      reconnectDelay: 5_000,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      connectionTimeout: 10_000,
    });
    socketClient.beforeConnect = async () => {
      const currentToken = readSession()?.accessToken;
      socketClient!.connectHeaders = currentToken
        ? { Authorization: `Bearer ${currentToken}` }
        : {};
    };
    socketClient.onConnect = () => {
      socketClient?.subscribe('/user/queue/notifications', handleMessage);
    };
    socketClient.activate();
  }

  let active = true;
  return () => {
    if (!active) return;
    active = false;
    socketSubscribers = Math.max(0, socketSubscribers - 1);
    if (socketSubscribers === 0 && socketClient) {
      const closingClient = socketClient;
      socketClient = null;
      void closingClient.deactivate();
    }
  };
}
