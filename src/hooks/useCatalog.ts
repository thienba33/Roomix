'use client';
import { useCallback, useEffect, useState } from 'react';
import { catalogWithRental as readCatalog, CATALOG_EVENT, type CatalogRoom } from '@/services/mock/rooms';
export function useCatalog() {
  const [items, setItems] = useState<CatalogRoom[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const retry = useCallback(() => {
    try { setItems(readCatalog()); setError(''); }
    catch { setError('Không thể đọc dữ liệu phòng đã lưu.'); }
    setReady(true);
  }, []);
  useEffect(() => {
    const sync = retry;
    const initial = window.setTimeout(sync, 0);
    window.addEventListener(CATALOG_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => { window.clearTimeout(initial); window.removeEventListener(CATALOG_EVENT, sync); window.removeEventListener('storage', sync); };
  }, [retry]);
  return { items, ready, error, retry };
}
