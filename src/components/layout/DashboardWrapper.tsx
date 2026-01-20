'use client';

import { SessionProvider } from '@/components/providers/SessionProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Navbar } from '@/components/layout/Navbar';

export function DashboardWrapper({
  children,
  session,
}: {
  children: React.ReactNode;
  session: any;
}) {
  return (
    <ThemeProvider>
      <SessionProvider session={session}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors" suppressHydrationWarning>
          <Navbar />
          <main className="container mx-auto px-4 py-8" suppressHydrationWarning>
            {children}
          </main>
        </div>
      </SessionProvider>
    </ThemeProvider>
  );
}
