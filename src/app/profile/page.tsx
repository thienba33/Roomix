import TenantShell from '@/components/layouts/TenantShell';
import AccountProfile from '@/components/account/AccountProfile';
export default function ProfilePage() {
  return <TenantShell><div className="tenant-management mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8"><AccountProfile role="TENANT" /></div></TenantShell>;
}
