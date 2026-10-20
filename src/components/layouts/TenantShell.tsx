import { type ReactNode } from 'react';
import TenantHeader from './TenantHeader';
import Footer from './Footer';

export default function TenantShell({ children, defaultAiOpen = false }: { children: ReactNode; defaultAiOpen?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <TenantHeader defaultAiOpen={defaultAiOpen} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
