import UsersWorkspace from '@/components/admin/UsersWorkspace';

export default async function UsersPage({ searchParams }: {
  searchParams: Promise<{ role?: string | string[]; status?: string | string[]; search?: string | string[] }>;
}) {
  const params = await searchParams;
  const role = typeof params.role === 'string' && ['TENANT', 'LANDLORD'].includes(params.role) ? params.role : '';
  const status = typeof params.status === 'string' && ['ACTIVE', 'LOCKED', 'PENDING_VERIFICATION'].includes(params.status) ? params.status : '';
  return <UsersWorkspace initialRole={role} initialStatus={status} initialSearch={typeof params.search === 'string' ? params.search : ''} />;
}
