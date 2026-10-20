// Lớp service — hiện trả dữ liệu mẫu từ lib/data.
// Đây là điểm nối (seam) để sau này thay bằng fetch(`${API_URL}/...`) tới backend thật.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
export { API_URL };

import {
  rooms, posts, requests, tenancies, invoices,
  notificationsLandlord, notificationsTenant, notificationsAdmin,
  usersAdmin, reports, auditLog, moderationQueue,
} from '@/lib/data';

export async function getRooms() { return rooms; }
export async function getRoom(id: number) { return rooms.find((r) => r.id === id) ?? null; }
export async function getPosts() { return posts; }
export async function getRequests() { return requests; }
export async function getTenancies() { return tenancies; }
export async function getInvoices() { return invoices; }
export async function getInvoice(id: number) { return invoices.find((i) => i.id === id) ?? null; }
export async function getNotifications(role: 'landlord' | 'tenant' | 'admin' = 'landlord') {
  if (role === 'tenant') return notificationsTenant;
  if (role === 'admin') return notificationsAdmin;
  return notificationsLandlord;
}
export async function getUsers() { return usersAdmin; }
export async function getReports() { return reports; }
export async function getAuditLog() { return auditLog; }
export async function getModerationQueue() { return moderationQueue; }
