import RentalWorkspace from '@/components/rental/RentalWorkspace';
export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ status?: string | string[]; record?: string | string[] }> }) {
  const params = await searchParams;
  const status = typeof params.status === 'string' && ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'].includes(params.status) ? params.status : '';
  return <RentalWorkspace mode="requests" initialFilter={status} initialRecord={typeof params.record === 'string' ? params.record : ''} />;
}
