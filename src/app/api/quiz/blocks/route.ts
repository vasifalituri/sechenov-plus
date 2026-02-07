import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/quiz/blocks - Получить доступные блоки для студентов
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subjectId');

    const blocks = await prisma.quizBlock.findMany({
      where: {
        isActive: true,
        ...(subjectId && { subjectId })
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: { questions: true }
        }
      },
      orderBy: [
        { orderIndex: 'asc' },
        { title: 'asc' }
      ]
    });

    // Получаем попытки пользователя для каждого блока
    const userAttempts = await prisma.quizAttempt.findMany({
      where: {
        userId: session.user.id,
        blockId: { in: blocks.map(b => b.id) },
        isCompleted: true
      },
      orderBy: { completedAt: 'desc' }
    });

    const attemptsMap = new Map();
    userAttempts.forEach(attempt => {
      if (!attemptsMap.has(attempt.blockId)) {
        attemptsMap.set(attempt.blockId, []);
      }
      attemptsMap.get(attempt.blockId).push(attempt);
    });

    const blocksWithProgress = blocks.map(block => ({
      ...block,
      questionCount: block._count.questions,
      userAttempts: attemptsMap.get(block.id) || [],
      bestScore: attemptsMap.get(block.id)?.[0]?.score || null,
      totalAttempts: attemptsMap.get(block.id)?.length || 0
    }));

    return NextResponse.json(blocksWithProgress);
  } catch (error) {
    console.error('Error fetching quiz blocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz blocks' },
      { status: 500 }
    );
  }
}
