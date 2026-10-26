'use client';

import { useEffect, useState } from 'react';
import { AUTH_EVENT } from '@/services/mock/auth';
import { INVOICE_EVENT, visibleInvoices, type MockInvoice } from '@/services/mock/invoices';
import { RENTAL_EVENT } from '@/services/mock/rental';

export function useInvoices() {
  const [items, setItems] = useState<MockInvoice[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const sync = () => {
      try { setItems(visibleInvoices()); setError(''); }
      catch (cause) { setItems([]); setError(cause instanceof Error ? cause.message : 'Không thể tải hóa đơn.'); }
      setReady(true);
    };
    sync();
    const events = [AUTH_EVENT, INVOICE_EVENT, RENTAL_EVENT, 'storage'];
    events.forEach((name) => window.addEventListener(name, sync));
    return () => events.forEach((name) => window.removeEventListener(name, sync));
  }, []);
  return { items, ready, error };
}
