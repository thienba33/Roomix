'use client';
import { useEffect, useState } from 'react';
import { visibleRental, RENTAL_EVENT, type RentalState } from '@/services/mock/rental';
import { AUTH_EVENT } from '@/services/mock/auth';
export function useRental() {
  const [state, setState] = useState<RentalState>({ requests: [], tenancies: [] });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const sync = () => {
      try { setState(visibleRental()); setError(''); }
      catch (e) { setState({ requests: [], tenancies: [] }); setError(e instanceof Error ? e.message : 'Không thể tải dữ liệu thuê.'); }
      setReady(true);
    };
    sync(); const timer = window.setInterval(sync, 15000);
    [RENTAL_EVENT, AUTH_EVENT, 'storage'].forEach((name) => window.addEventListener(name, sync));
    return () => { window.clearInterval(timer); [RENTAL_EVENT, AUTH_EVENT, 'storage'].forEach((name) => window.removeEventListener(name, sync)); };
  }, []);
  return { ...state, ready, error };
}
