'use client';

import RentalWorkspace from '@/components/rental/RentalWorkspace';
import TenantDirectory from '@/components/rental/TenantDirectory';

export default function ContractsPage() {
  return <div className="space-y-10 pb-6">
    <TenantDirectory />
    <RentalWorkspace mode="contracts" />
  </div>;
}
