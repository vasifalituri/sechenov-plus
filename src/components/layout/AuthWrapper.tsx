'use client';

import { ThemeProvider } from '@/components/providers/ThemeProvider';

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}
