import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ProfilePageClient } from '@/components/profile/ProfilePageClient';

async function getUserProfile(userId: string) {
  const [user, materials, threads, comments] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        academicYear: true,
        role: true,
        status: true,
        createdAt: true,
        profileImage: true,
      },
    }),
    prisma.material.findMany({
      where: { uploadedById: userId },
      include: { subject: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.discussionThread.findMany({
      where: { authorId: userId },
      include: { subject: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.comment.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  const stats = await Promise.all([
    prisma.material.count({ where: { uploadedById: userId, status: 'APPROVED' } }),
    prisma.discussionThread.count({ where: { authorId: userId, status: 'APPROVED' } }),
    prisma.comment.count({ where: { authorId: userId, status: 'APPROVED' } }),
  ]);

  return {
    user,
    materials,
    threads,
    comments,
    stats: {
      materials: stats[0],
      threads: stats[1],
      comments: stats[2],
    },
  };
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const profile = await getUserProfile(session.user.id);

  return <ProfilePageClient initialProfile={profile} />;
}
