import type { CatalogRoom } from '@/services/mock/rooms';
import type { RentalState } from '@/services/mock/rental';

export function landlordOverview(userId: string, catalog: CatalogRoom[], rental: RentalState) {
  const rooms = catalog.filter((r) => r.landlordId === userId);
  const requests = rental.requests.filter((r) => r.landlordId === userId);
  const tenancies = rental.tenancies.filter((t) => t.landlordId === userId);
  const rented = rooms.filter((r) => r.roomStatus === 'OCCUPIED').length;
  const waiting = tenancies.filter((t) => t.status === 'PENDING');
  const reservedIds = new Set(waiting.map((t) => t.roomId));
  return {
    total: rooms.length, rented, occupancy: rooms.length ? Math.round(rented / rooms.length * 100) : 0,
    available: rooms.filter((r) => r.roomStatus === 'AVAILABLE' && !r.detail.rented && !reservedIds.has(r.detail.roomId)).length,
    pendingRequests: requests.filter((r) => r.status === 'PENDING').length,
    pendingDeposits: waiting.length,
    drafts: rooms.filter((r) => r.postStatus === 'DRAFT').length,
    rejected: rooms.filter((r) => r.postStatus === 'REJECTED').length,
    recent: requests.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5).map((r) => ({ ...r, title: rooms.find((room) => room.detail.roomId === r.roomId)?.detail.title || 'Phòng thuê' })),
  };
}
