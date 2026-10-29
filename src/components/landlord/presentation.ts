export const ROOM_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Phòng trống', OCCUPIED: 'Đang thuê', RESERVED: 'Đã giữ chỗ', MAINTENANCE: 'Bảo trì',
};
export function hostDate(value: string, withTime = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return withTime ? date.toLocaleString('vi-VN', { timeZone: 'Asia/Bangkok', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : date.toLocaleDateString('vi-VN', { timeZone: 'Asia/Bangkok' });
}
