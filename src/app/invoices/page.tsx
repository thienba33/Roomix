import TenantShell from '@/components/layouts/TenantShell';
import InvoiceWorkspace from '@/components/rental/InvoiceWorkspace';

export default function TenantInvoicesPage() {
  return <TenantShell><div className="mx-auto max-w-5xl px-4 py-8 sm:px-6"><InvoiceWorkspace role="TENANT" /></div></TenantShell>;
}
