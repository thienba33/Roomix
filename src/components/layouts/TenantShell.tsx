import { type ReactNode } from 'react';
import TenantHeader from './TenantHeader';
import Footer from './Footer';
import { ToastProvider } from '@/components/ui/Toast';

export default function TenantShell({ children, defaultAiOpen = false }: { children: ReactNode; defaultAiOpen?: boolean }) {
  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col bg-white">
        <TenantHeader defaultAiOpen={defaultAiOpen} />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </ToastProvider>
  );
}
