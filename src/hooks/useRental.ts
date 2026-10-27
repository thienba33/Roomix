'use client';
import { useApiData } from './useApiData';
import { visibleRental, RENTAL_EVENT, type RentalState } from '@/services/backend/rental';
const EMPTY: RentalState = { requests: [], tenancies: [] };
export function useRental() {
  const { data, ...state } = useApiData('rental', visibleRental, EMPTY, RENTAL_EVENT, 15000);
  return { ...data, ...state };
}
