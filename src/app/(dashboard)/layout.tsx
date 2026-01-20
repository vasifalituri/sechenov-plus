import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { DashboardWrapper } from '@/components/layout/DashboardWrapper';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if (session.user.status !== 'APPROVED') {
    redirect('/login');
  }

  return (
    <DashboardWrapper session={session}>
      {children}
    </DashboardWrapper>
  );
}
