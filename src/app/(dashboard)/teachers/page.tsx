import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import TeachersPageClient from '@/components/teachers/TeachersPageClient';

export const metadata: Metadata = {
  title: 'Рейтинг преподавателей | Sechenov+',
  description: 'Рейтинг и отзывы о преподавателях медицинского университета',
};

export default async function TeachersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return <TeachersPageClient />;
}
