import TenantShell from '@/components/layouts/TenantShell';
import InvoiceWorkspace from '@/components/rental/InvoiceWorkspace';

export default function TenantInvoicesPage() {
  return <TenantShell><div className="tenant-management mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8"><InvoiceWorkspace role="TENANT" /></div></TenantShell>;
}
