import TenantShell from '@/components/layouts/TenantShell';
import RentalWorkspace from '@/components/rental/RentalWorkspace';
export default function ContractsPage() {
  return <TenantShell><div className="mx-auto max-w-5xl px-4 py-8 sm:px-6"><RentalWorkspace mode="tenant-contracts" /></div></TenantShell>;
}
