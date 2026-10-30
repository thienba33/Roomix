import { allPages, api, emit, post } from './http';
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
export const getRentalRequest = (id: string) => api<RentalRequest>(`/api/rentals/${encodeURIComponent(id)}`);
export const getTenancy = (id: string) => api<Tenancy>(`/api/tenancies/${encodeURIComponent(id)}`);
export const RENTAL_EVENT = 'roomix:rental';
export interface RentalContactCard {
  id: string; rentalRequestId: string; landlordId: string; landlordName: string;
  landlordPhone: string; landlordZalo?: string | null; landlordAvatarUrl?: string | null;
  note?: string | null; issuedAt: string;
}
export const getRentalContactCard = (requestId: string) =>
  api<RentalContactCard>(`/api/rentals/${encodeURIComponent(requestId)}/contact-card`);
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

export interface SettlementPreviewRequest {
  actualReturnDate: string;
  finalElectricity: number;
  finalWater: number;
  damageCharge: number;
  damageReason?: string;
}

export interface CompleteSettlementRequest {
  details: SettlementPreviewRequest;
  expectedTotalDue: number;
  collectedAmount: number;
  refundedAmount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER';
}

export interface TenancySettlement {
  id: string;
  tenancyId: string;
  actualReturnDate: string;
  lastBilledMonth?: string;
  unbilledMonths: number;
  previousElectricity: number;
  finalElectricity: number;
  previousWater: number;
  finalWater: number;
  monthlyRent: number;
  electricityUnitPrice: number;
  waterUnitPrice: number;
  damageCharge: number;
  invoiceDebt: number;
  additionalRent: number;
  additionalElectricity: number;
  additionalWater: number;
  totalDue: number;
  depositAmount: number;
  depositApplied: number;
  amountToCollect: number;
  amountToRefund: number;
  collectedAmount: number;
  refundedAmount: number;
  damageReason?: string;
  paymentMethod: string;
  settledBy: string;
  createdAt: string;
  invoiceBalances?: Record<string, number>;
}

export const endTenancy = (tenancyId: string, actualReturnDate: string) =>
  mutate<Tenancy>(`/api/tenancies/${tenancyId}/end`, { actualReturnDate });

export const previewSettlement = (tenancyId: string, request: SettlementPreviewRequest) =>
  mutate<TenancySettlement>(`/api/tenancies/${tenancyId}/settlement/preview`, request);

export const completeSettlement = (tenancyId: string, request: CompleteSettlementRequest) =>
  mutate<TenancySettlement>(`/api/tenancies/${tenancyId}/settlement`, request);

export const getSettlement = (tenancyId: string) =>
  api<TenancySettlement>(`/api/tenancies/${tenancyId}/settlement`);
