'use client';

import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        // Default options
        duration: 4000,
        style: {
          background: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--border))',
          padding: '16px',
          borderRadius: '8px',
          fontSize: '14px',
        },
        // Success
        success: {
          duration: 3000,
          style: {
            background: 'hsl(var(--background))',
            border: '1px solid hsl(142.1 76.2% 36.3%)',
          },
          iconTheme: {
            primary: 'hsl(142.1 76.2% 36.3%)',
            secondary: 'hsl(var(--background))',
          },
        },
        // Error
        error: {
          duration: 5000,
          style: {
            background: 'hsl(var(--background))',
            border: '1px solid hsl(0 84.2% 60.2%)',
          },
          iconTheme: {
            primary: 'hsl(0 84.2% 60.2%)',
            secondary: 'hsl(var(--background))',
          },
        },
        // Loading
        loading: {
          style: {
            background: 'hsl(var(--background))',
            border: '1px solid hsl(var(--primary))',
          },
          iconTheme: {
            primary: 'hsl(var(--primary))',
            secondary: 'hsl(var(--background))',
          },
        },
      }}
    />
  );
}
