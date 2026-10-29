import type { ReactNode } from 'react';

export default function AuthScene({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-w-0 bg-white px-5 pb-6 pt-10 sm:px-7 sm:pb-7">
      {children}
    </div>
  );
}
