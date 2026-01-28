import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, MessageSquare, Users } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { GlobalSearch } from '@/components/layout/GlobalSearch';
import { AnnouncementBanner } from '@/components/shared/AnnouncementBanner';

async function getStats() {
  const [materialsCount, threadsCount, usersCount] = await Promise.all([
    prisma.material.count({ where: { status: 'APPROVED' } }),
    prisma.discussionThread.count({ where: { status: 'APPROVED' } }),
    prisma.user.count({ where: { status: 'APPROVED' } }),
  ]);

  return { materialsCount, threadsCount, usersCount };
}

async function getRecentMaterials() {
  return prisma.material.findMany({
    where: { status: 'APPROVED' },
    include: {
      subject: true,
      uploadedBy: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
}

async function getRecentThreads(userId?: string) {
  return prisma.discussionThread.findMany({
    where: { status: 'APPROVED' },
    include: {
      subject: true,
      author: {
        select: {
          id: true,
          username: true,
          fullName: true,
          academicYear: true,
        },
      },
      votes: userId ? {
        where: { userId },
        select: { type: true },
      } : false,
      _count: {
        select: {
          comments: { where: { status: 'APPROVED' } },
        },
      },
    },
    orderBy: [
      { isPinned: 'desc' },
      { upvotes: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 5,
  });
}

async function getTopThreads(userId?: string) {
  return prisma.discussionThread.findMany({
    where: { status: 'APPROVED' },
    include: {
      subject: true,
      author: {
        select: {
          id: true,
          username: true,
          fullName: true,
          academicYear: true,
        },
      },
      votes: userId ? {
        where: { userId },
        select: { type: true },
      } : false,
      _count: {
        select: {
          comments: { where: { status: 'APPROVED' } },
        },
      },
    },
    orderBy: { upvotes: 'desc' },
    take: 5,
  });
}

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const [stats, recentMaterials, recentThreads, topThreads] = await Promise.all([
    getStats(),
    getRecentMaterials(),
    getRecentThreads(session?.user?.id),
    getTopThreads(session?.user?.id),
  ]);

  // Transform threads
  const transformThreads = (threads: any[]) => threads.map((thread: any) => ({
    ...thread,
    userVote: thread.votes && thread.votes.length > 0 ? thread.votes[0].type : null,
    votes: undefined,
    score: thread.upvotes - thread.downvotes,
  }));

  const transformedRecentThreads = transformThreads(recentThreads);
  const transformedTopThreads = transformThreads(topThreads);

  return (
    <div className="space-y-8">
      {/* Global Search Bar */}
      <Card className="p-6">
        <div className="flex flex-col space-y-3">
          <h2 className="text-xl font-semibold">🔍 Поиск по всему сайту</h2>
          <p className="text-sm text-muted-foreground">
            Найдите материалы, обсуждения или пользователей
          </p>
          <div className="w-full">
            <GlobalSearch />
          </div>
        </div>
      </Card>

      {/* Announcements */}
      <AnnouncementBanner />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Материалы</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.materialsCount}</div>
            <p className="text-xs text-muted-foreground">Доступных файлов</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Обсуждения</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.threadsCount}</div>
            <p className="text-xs text-muted-foreground">Активных тем</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Участники</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usersCount}</div>
            <p className="text-xs text-muted-foreground">Активных студентов</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Discussions - Reddit style */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔥 Топ обсуждения
            </CardTitle>
            <CardDescription>Самые популярные темы</CardDescription>
          </CardHeader>
          <CardContent>
            {transformedTopThreads.length === 0 ? (
              <p className="text-muted-foreground text-sm">Пока нет обсуждений</p>
            ) : (
              <div className="space-y-3">
                {transformedTopThreads.map((thread, index) => (
                  <Link
                    key={thread.id}
                    href={`/discussions/${thread.id}`}
                    className="block hover:bg-gray-50 dark:hover:bg-gray-800 p-3 rounded-md transition-colors border-l-2 border-orange-500"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl font-bold text-orange-500">
                        #{index + 1}
                      </span>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm line-clamp-1">{thread.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span className="font-medium text-orange-500">
                            ⬆ {thread.score} баллов
                          </span>
                          <span>•</span>
                          <span>💬 {thread._count.comments}</span>
                          <span>•</span>
                          <span>{thread.subject.name}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Discussions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🆕 Новые обсуждения
            </CardTitle>
            <CardDescription>Недавно созданные темы</CardDescription>
          </CardHeader>
          <CardContent>
            {transformedRecentThreads.length === 0 ? (
              <p className="text-muted-foreground text-sm">Пока нет обсуждений</p>
            ) : (
              <div className="space-y-3">
                {transformedRecentThreads.map((thread) => (
                  <Link
                    key={thread.id}
                    href={`/discussions/${thread.id}`}
                    className="block hover:bg-gray-50 dark:hover:bg-gray-800 p-3 rounded-md transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm line-clamp-1">{thread.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span className={thread.author.role === 'ADMIN' ? 'text-cyan-600 dark:text-cyan-400 font-semibold' : ''}>
                            @{thread.author.username}
                          </span>
                          <span>•</span>
                          <span>{thread.subject.name}</span>
                          {thread.score > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-orange-500 font-medium">
                                ⬆ {thread.score}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(thread.createdAt)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Materials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📚 Последние материалы
          </CardTitle>
          <CardDescription>Недавно добавленные файлы</CardDescription>
        </CardHeader>
        <CardContent>
          {recentMaterials.length === 0 ? (
            <p className="text-muted-foreground text-sm">Пока нет материалов</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentMaterials.map((material) => (
                <Link
                  key={material.id}
                  href={`/materials/${material.id}`}
                  className="block hover:bg-gray-50 dark:hover:bg-gray-800 p-3 rounded-md transition-colors border"
                >
                  <div className="flex flex-col">
                    <h4 className="font-medium text-sm line-clamp-2 mb-2">{material.title}</h4>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{material.subject.name}</span>
                      <span>{material.academicYear} курс</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
