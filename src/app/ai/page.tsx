import TenantShell from '@/components/layouts/TenantShell';
import HomeContent from '../HomeContent';

export default function AiPage() {
  return (
    <TenantShell defaultAiOpen>
      <HomeContent />
    </TenantShell>
  );
}
