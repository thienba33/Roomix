import TenantShell from '@/components/layouts/TenantShell';
import AccountProfile from '@/components/account/AccountProfile';
export default function ProfilePage() {
  return <TenantShell><div className="mx-auto max-w-5xl px-4 py-8 sm:px-6"><AccountProfile role="TENANT" /></div></TenantShell>;
}
