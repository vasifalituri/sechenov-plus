import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, MessageSquare, Clock } from 'lucide-react';

async function getAdminStats() {
  const [
    totalUsers,
    pendingUsers,
    approvedUsers,
    totalMaterials,
    pendingMaterials,
    totalThreads,
    pendingThreads,
    totalComments,
    pendingComments,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'PENDING' } }),
    prisma.user.count({ where: { status: 'APPROVED' } }),
    prisma.material.count(),
    prisma.material.count({ where: { status: 'PENDING' } }),
    prisma.discussionThread.count(),
    prisma.discussionThread.count({ where: { status: 'PENDING' } }),
    prisma.comment.count(),
    prisma.comment.count({ where: { status: 'PENDING' } }),
  ]);

  return {
    totalUsers,
    pendingUsers,
    approvedUsers,
    totalMaterials,
    pendingMaterials,
    totalThreads,
    pendingThreads,
    totalComments,
    pendingComments,
  };
}

async function getRecentActivity() {
  const [recentUsers, recentMaterials, recentThreads] = await Promise.all([
    prisma.user.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        fullName: true,
        email: true,
        academicYear: true,
        createdAt: true,
      },
    }),
    prisma.material.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        createdAt: true,
        uploadedBy: {
          select: { fullName: true },
        },
      },
    }),
    prisma.discussionThread.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        createdAt: true,
        author: {
          select: { fullName: true },
        },
      },
    }),
  ]);

  return { recentUsers, recentMaterials, recentThreads };
}

export default async function AdminDashboard() {
  const stats = await getAdminStats();
  const activity = await getRecentActivity();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Панель управления</h2>
        <p className="text-muted-foreground mt-2">
          Управление платформой и модерация контента
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Пользователи</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingUsers} ожидают одобрения
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Материалы</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMaterials}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingMaterials} на модерации
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Обсуждения</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalThreads}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingThreads} на модерации
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Комментарии</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalComments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingComments} на модерации
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Заявки на регистрацию</CardTitle>
            <CardDescription>Пользователи ожидают одобрения</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет заявок</p>
            ) : (
              <div className="space-y-3">
                {activity.recentUsers.map((user) => (
                  <div key={user.id} className="text-sm">
                    <p className="font-medium">{user.fullName}</p>
                    <p className="text-muted-foreground text-xs">
                      {user.email} • {user.academicYear} курс
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Материалы на модерации</CardTitle>
            <CardDescription>Требуют проверки</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.recentMaterials.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет материалов</p>
            ) : (
              <div className="space-y-3">
                {activity.recentMaterials.map((material) => (
                  <div key={material.id} className="text-sm">
                    <p className="font-medium">{material.title}</p>
                    <p className="text-muted-foreground text-xs">
                      от {material.uploadedBy.fullName}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Обсуждения на модерации</CardTitle>
            <CardDescription>Требуют проверки</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.recentThreads.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет обсуждений</p>
            ) : (
              <div className="space-y-3">
                {activity.recentThreads.map((thread) => (
                  <div key={thread.id} className="text-sm">
                    <p className="font-medium">{thread.title}</p>
                    <p className="text-muted-foreground text-xs">
                      от {thread.author.fullName}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
