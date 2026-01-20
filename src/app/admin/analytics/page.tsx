import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, MessageSquare, TrendingUp, Download } from 'lucide-react';

async function getAnalytics() {
  const [
    totalUsers,
    usersByYear,
    totalMaterials,
    materialsBySubject,
    totalThreads,
    totalComments,
    topMaterials,
  ] = await Promise.all([
    prisma.user.count({ where: { status: 'APPROVED' } }),
    prisma.user.groupBy({
      by: ['academicYear'],
      where: { status: 'APPROVED' },
      _count: true,
    }),
    prisma.material.count({ where: { status: 'APPROVED' } }),
    prisma.material.groupBy({
      by: ['subjectId'],
      where: { status: 'APPROVED' },
      _count: true,
    }),
    prisma.discussionThread.count({ where: { status: 'APPROVED' } }),
    prisma.comment.count({ where: { status: 'APPROVED' } }),
    prisma.material.findMany({
      where: { status: 'APPROVED' },
      orderBy: { downloadCount: 'desc' },
      take: 10,
      include: {
        subject: true,
        uploadedBy: {
          select: { fullName: true },
        },
      },
    }),
  ]);

  // Get subject names
  const subjects = await prisma.subject.findMany();
  const subjectMap = Object.fromEntries(subjects.map((s) => [s.id, s.name]));

  const materialsBySubjectWithNames = materialsBySubject.map((item) => ({
    subject: subjectMap[item.subjectId] || 'Unknown',
    count: item._count,
  }));

  return {
    totalUsers,
    usersByYear,
    totalMaterials,
    materialsBySubject: materialsBySubjectWithNames,
    totalThreads,
    totalComments,
    topMaterials,
  };
}

export default async function AnalyticsPage() {
  const analytics = await getAnalytics();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Аналитика</h2>
        <p className="text-muted-foreground mt-2">
          Статистика использования платформы
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активных пользователей</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Материалов</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalMaterials}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Обсуждений</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalThreads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Комментариев</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalComments}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by Year */}
        <Card>
          <CardHeader>
            <CardTitle>Пользователи по курсам</CardTitle>
            <CardDescription>Распределение студентов</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.usersByYear.map((item) => (
                <div key={item.academicYear} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.academicYear} курс</span>
                  <span className="text-2xl font-bold">{item._count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Materials by Subject */}
        <Card>
          <CardHeader>
            <CardTitle>Материалы по предметам</CardTitle>
            <CardDescription>Топ предметов</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.materialsBySubject
                .sort((a, b) => b.count - a.count)
                .slice(0, 8)
                .map((item) => (
                  <div key={item.subject} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.subject}</span>
                    <span className="text-xl font-bold">{item.count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Materials */}
      <Card>
        <CardHeader>
          <CardTitle>Популярные материалы</CardTitle>
          <CardDescription>Топ 10 по количеству скачиваний</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.topMaterials.map((material, index) => (
              <div key={material.id} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{material.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {material.subject.name} • {material.academicYear} курс • {material.uploadedBy.fullName}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Download className="w-4 h-4" />
                  <span className="font-bold">{material.downloadCount}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
