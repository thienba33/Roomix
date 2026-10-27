'use client';
import { useCallback } from 'react';
import { useApiData } from './useApiData';
import { getRoomDetail, CATALOG_EVENT, type RoomDetail } from '@/services/backend/rooms';
import { ApiError } from '@/services/backend/http';
const EMPTY: RoomDetail[] = [];
export function useRoomDetails(roomIds: string[]) {
  const key = [...new Set(roomIds)].sort().join(',');
  const load = useCallback(async () => {
    if (!key) return EMPTY;
    const results = await Promise.all(key.split(',').map(async (id) => {
      try { return await getRoomDetail(id); }
      catch (cause) {
        // Historic contracts can reference hidden/unpublished rooms. The public
        // API cannot resolve them; keep their actual UUID in rental screens.
        if (cause instanceof ApiError && [403, 404].includes(cause.status)) return null;
        throw cause;
      }
    }));
    return results.filter((item): item is RoomDetail => item !== null);
  }, [key]);
  const { data: items, ...state } = useApiData(`room-details:${key}`, load, EMPTY, CATALOG_EVENT);
  return { items, ...state };
}
