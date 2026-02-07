import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/quiz/stats - Получить статистику пользователя
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Общая статистика
    const [
      totalAttempts,
      completedAttempts,
      averageScoreData,
      recentAttempts,
      statsBySubject
    ] = await Promise.all([
      // Всего попыток
      prisma.quizAttempt.count({
        where: { userId }
      }),
      
      // Завершенных попыток
      prisma.quizAttempt.count({
        where: { userId, isCompleted: true }
      }),
      
      // Средний балл
      prisma.quizAttempt.aggregate({
        where: { userId, isCompleted: true },
        _avg: { score: true }
      }),
      
      // Последние 5 попыток
      prisma.quizAttempt.findMany({
        where: { userId, isCompleted: true },
        include: {
          subject: { select: { name: true } },
          block: { select: { title: true } }
        },
        orderBy: { completedAt: 'desc' },
        take: 5
      }),
      
      // Статистика по предметам
      prisma.quizAttempt.groupBy({
        by: ['subjectId'],
        where: {
          userId,
          isCompleted: true,
          subjectId: { not: null }
        },
        _count: true,
        _avg: { score: true }
      })
    ]);

    // Получаем названия предметов
    const subjectIds = statsBySubject
      .map(s => s.subjectId)
      .filter((id): id is string => id !== null);
    
    const subjects = await prisma.subject.findMany({
      where: { id: { in: subjectIds } },
      select: { id: true, name: true }
    });

    const subjectsMap = new Map(subjects.map(s => [s.id, s.name]));

    const statsBySubjectWithNames = statsBySubject.map(stat => ({
      subjectId: stat.subjectId,
      subjectName: stat.subjectId ? subjectsMap.get(stat.subjectId) : null,
      attempts: stat._count,
      averageScore: stat._avg.score || 0
    }));

    return NextResponse.json({
      totalAttempts,
      completedAttempts,
      averageScore: averageScoreData._avg.score || 0,
      recentAttempts,
      statsBySubject: statsBySubjectWithNames
    });
  } catch (error) {
    console.error('Error fetching quiz stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
