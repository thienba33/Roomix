import RentalWorkspace from '@/components/rental/RentalWorkspace';
import TenantDirectory from '@/components/rental/TenantDirectory';
export default async function ContractsPage({ searchParams }: { searchParams: Promise<{ status?: string | string[]; record?: string | string[] }> }) {
  const params = await searchParams;
  const status = typeof params.status === 'string' && ['PENDING', 'ACTIVE', 'CANCELLED', 'ENDED'].includes(params.status) ? params.status : '';
  return <div className="space-y-6 pb-6">
    <details className="host-directory-toggle"><summary>Danh sách khách thuê</summary><div className="pt-5"><TenantDirectory /></div></details>
    <RentalWorkspace mode="contracts" initialFilter={status} initialRecord={typeof params.record === 'string' ? params.record : ''} />
  </div>;
}
