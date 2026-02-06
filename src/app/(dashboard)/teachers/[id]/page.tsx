import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import TeacherProfileClient from '@/components/teachers/TeacherProfileClient';

export const metadata: Metadata = {
  title: 'Профиль преподавателя | Sechenov+',
};

export default async function TeacherProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: {
      subjects: {
        include: {
          subject: true,
        },
      },
      ratings: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              username: true,
              profileImage: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      reviews: {
        where: {
          status: 'APPROVED',
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              username: true,
              profileImage: true,
            },
          },
          helpfulness: {
            where: {
              userId: session.user.id,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      _count: {
        select: {
          ratings: true,
          reviews: true,
        },
      },
    },
  });

  if (!teacher) {
    redirect('/teachers');
  }

  // Получаем рейтинг текущего пользователя
  const userRating = await prisma.teacherRating.findUnique({
    where: {
      teacherId_userId: {
        teacherId: id,
        userId: session.user.id,
      },
    },
  });

  return (
    <TeacherProfileClient
      teacher={teacher}
      userRating={userRating}
      currentUserId={session.user.id}
      isAdminOrModerator={
        session.user.role === 'ADMIN' || session.user.role === 'MODERATOR'
      }
    />
  );
}
