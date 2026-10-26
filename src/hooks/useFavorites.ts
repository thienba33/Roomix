'use client';
import { useApiData } from './useApiData';
import { listFavorites, FAVORITES_EVENT, type FavoriteResponse } from '@/services/backend/rooms';
import { readSession } from '@/services/backend/session';
const EMPTY: FavoriteResponse[] = [];
async function load() { return readSession()?.user.role === 'TENANT' ? listFavorites() : EMPTY; }
export function useFavorites() {
  const { data: items, ...state } = useApiData('favorites', load, EMPTY, FAVORITES_EVENT);
  return { items, ...state };
}
