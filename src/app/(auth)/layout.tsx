import { AuthWrapper } from '@/components/layout/AuthWrapper';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthWrapper>{children}</AuthWrapper>;
}
