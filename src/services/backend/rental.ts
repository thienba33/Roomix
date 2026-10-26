import { allPages, emit, post } from './http';
import { readSession } from './session';
export interface RentalRequest {
  id: string; roomId: string; postId: string; tenantId: string; landlordId: string;
  note: string; status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED'; rejectReason?: string;
  createdAt: string; updatedAt: string; contactRequestedAt?: string;
}
export interface ContractTerms {
  startDate: string; endDate: string; monthlyRent: number; depositAmount: number;
  electricityUnitPrice: number; waterUnitPrice: number; initialElectricity: number; initialWater: number;
  termsAndConditions: string; depositDeadline?: string;
}
export interface Tenancy extends ContractTerms {
  id: string; contractCode: string; rentalRequestId: string; roomId: string; tenantId: string; landlordId: string;
  status: 'PENDING' | 'ACTIVE' | 'CANCELLED' | 'ENDED'; depositDeadline: string;
  cancellationReason?: string; depositConfirmedAt?: string; createdAt: string; updatedAt: string;
}
export interface RentalState { requests: RentalRequest[]; tenancies: Tenancy[]; }
export const RENTAL_EVENT = 'roomix:rental';
export function todayVN(now = Date.now()) { return new Date(now + 7 * 3600000).toISOString().slice(0, 10); }
export async function visibleRental(): Promise<RentalState> {
  const role = readSession()?.user.role;
  if (role !== 'TENANT' && role !== 'LANDLORD') return { requests: [], tenancies: [] };
  const [requests, tenancies] = await Promise.all([allPages<RentalRequest>('/api/rentals'), allPages<Tenancy>('/api/tenancies')]);
  return { requests, tenancies };
}
async function mutate<T>(path: string, body?: unknown) { const result = await post<T>(path, body); emit(RENTAL_EVENT); return result; }
export const sendRental = (roomId: string, note: string) => mutate<RentalRequest>('/api/rentals', { roomId, note });
export const cancelRental = (id: string) => mutate<RentalRequest>(`/api/rentals/${id}/cancel`);
export const rejectRental = (id: string, reason: string) => mutate<RentalRequest>(`/api/rentals/${id}/reject`, { reason });
export const acceptRental = (id: string, terms: ContractTerms) => mutate<Tenancy>(`/api/rentals/${id}/accept`, terms);
export const cancelTenancy = (id: string, reason: string) => mutate<Tenancy>(`/api/tenancies/${id}/cancel`, { reason });
export const confirmDeposit = (id: string) => mutate<Tenancy>(`/api/tenancies/${id}/confirm-deposit`);
