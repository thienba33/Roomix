'use client';

import RentalWorkspace from '@/components/rental/RentalWorkspace';
import TenantDirectory from '@/components/rental/TenantDirectory';

export default function ContractsPage() {
  return <div className="space-y-6 pb-6">
    <details className="host-directory-toggle"><summary>Danh sách khách thuê</summary><div className="pt-5"><TenantDirectory /></div></details>
    <RentalWorkspace mode="contracts" />
  </div>;
}
