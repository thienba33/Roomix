export const OPEN_AI_EVENT = 'roomix:tenant:open-ai';
export const NOTIFICATIONS_EVENT = 'roomix:preferences';
const KEY = 'roomix_ui_notifications_v1';
export function getNotificationsEnabled(): boolean {
  try { return localStorage.getItem(KEY) !== 'false'; } catch { return true; }
}
export function setNotificationsEnabled(enabled: boolean) {
  try { localStorage.setItem(KEY, String(enabled)); } catch { /* Optional browser preference. */ }
  window.dispatchEvent(new Event(NOTIFICATIONS_EVENT));
}
export function profileInitials(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]).join('').toUpperCase();
}
