'use client';
import { useCallback } from 'react';
import type { Tenancy } from '@/services/backend/rental';
import { useApiData } from './useApiData';
import { visibleInvoices, financialInvoices, getInvoice, loadInvoiceDraft, listInvoiceReminders, type InvoiceReminder, INVOICE_EVENT, type InvoiceSummary, type FinancialInvoice } from '@/services/backend/invoices';
const EMPTY: InvoiceSummary[] = [];
const EMPTY_FINANCES: FinancialInvoice[] = [];
export function useInvoices() {
  const { data: items, ...state } = useApiData('invoice-summaries', visibleInvoices, EMPTY, INVOICE_EVENT, 30000);
  return { items, ...state };
}
export function useFinancialInvoices() {
  const { data: items, ...state } = useApiData('financial-invoices', financialInvoices, EMPTY_FINANCES, INVOICE_EVENT, 30000);
  return { items, ...state };
}

export function useInvoiceDetail(id: string) {
  const load = useCallback(() => id ? getInvoice(id) : Promise.resolve(null), [id]);
  return useApiData(`invoice-detail:${id}`, load, null, INVOICE_EVENT, 30000);
}
export function useInvoiceDraft(enabled: boolean, tenancyJson: string) {
  const load = useCallback(() => {
    const tenancy = JSON.parse(tenancyJson) as Tenancy | null;
    return enabled && tenancy ? loadInvoiceDraft(tenancy.id, [tenancy]) : Promise.resolve(null);
  }, [enabled, tenancyJson]);
  return useApiData(`invoice-draft:${tenancyJson}:${enabled}`, load, null, INVOICE_EVENT);
}
const EMPTY_REMINDERS: InvoiceReminder[] = [];
export function useInvoiceReminders(enabled: boolean) {
  const load = useCallback(() => enabled ? listInvoiceReminders() : Promise.resolve(EMPTY_REMINDERS), [enabled]);
  return useApiData('invoice-reminders', load, EMPTY_REMINDERS, INVOICE_EVENT);
}
