import InvoiceWorkspace from '@/components/rental/InvoiceWorkspace';
export default async function LandlordInvoicesPage({ searchParams }: { searchParams: Promise<{ status?: string | string[]; invoice?: string | string[] }> }) {
  const params = await searchParams;
  const status = typeof params.status === 'string' && ['ALL', 'PENDING', 'CONFIRMED', 'PAID', 'OVERDUE'].includes(params.status) ? params.status : 'ALL';
  return <InvoiceWorkspace role="LANDLORD" initialFilter={status} initialInvoice={typeof params.invoice === 'string' ? params.invoice : ''} />;
}
