import TenantShell from '@/components/layouts/TenantShell';
import RentalWorkspace from '@/components/rental/RentalWorkspace';
export default function ContractsPage() {
  return <TenantShell><div className="tenant-management mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8"><RentalWorkspace mode="tenant-contracts" /></div></TenantShell>;
}
