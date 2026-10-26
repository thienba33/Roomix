'use client';
import { useApiData } from './useApiData';
import { visibleInvoices, INVOICE_EVENT, type InvoiceRecord } from '@/services/backend/invoices';
const EMPTY: InvoiceRecord[] = [];
export function useInvoices() {
  const { data: items, ...state } = useApiData('invoices', visibleInvoices, EMPTY, INVOICE_EVENT, 30000);
  return { items, ...state };
}
