import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminTeachersClient from '@/components/admin/AdminTeachersClient';

export const metadata: Metadata = {
  title: 'Управление преподавателями | Admin',
};

export default async function AdminTeachersPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/');
  }

  return <AdminTeachersClient />;
}
