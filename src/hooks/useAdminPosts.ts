'use client';
import { useApiData } from './useApiData';
import { loadAdminPosts, CATALOG_EVENT, type AdminPost } from '@/services/backend/rooms';
const EMPTY: AdminPost[] = [];
export function useAdminPosts() {
  const { data: items, ...state } = useApiData('admin-posts', loadAdminPosts, EMPTY, CATALOG_EVENT, 30000);
  return { items, ...state };
}
