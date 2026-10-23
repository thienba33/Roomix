'use client';
import { useEffect, useState } from 'react';
import { catalogWithRental as readCatalog, CATALOG_EVENT, type CatalogRoom } from '@/services/mock/rooms';
export function useCatalog() {
  const [items, setItems] = useState<CatalogRoom[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const sync = () => {
      try { setItems(readCatalog()); setError(''); }
      catch { setError('Không thể đọc dữ liệu phòng đã lưu.'); }
      setReady(true);
    };
    sync();
    window.addEventListener(CATALOG_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener(CATALOG_EVENT, sync); window.removeEventListener('storage', sync); };
  }, []);
  return { items, ready, error };
}
