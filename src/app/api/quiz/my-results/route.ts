import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET /api/quiz/my-results - Получить результаты текущего пользователя
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode'); // RANDOM_30 или BLOCK
    const subjectId = searchParams.get('subjectId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {
      userId: session.user.id,
      isCompleted: true
    };

    if (mode) where.mode = mode;
    if (subjectId) where.subjectId = subjectId;

    const [attempts, total] = await Promise.all([
      prisma.quizAttempt.findMany({
        where,
        include: {
          subject: {
            select: { id: true, name: true, slug: true }
          },
          block: {
            select: { id: true, title: true }
          }
        },
        orderBy: { completedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.quizAttempt.count({ where })
    ]);

    return NextResponse.json({
      attempts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}
