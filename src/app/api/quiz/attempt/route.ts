import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/quiz/attempt - Получить активную попытку пользователя
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const attemptId = searchParams.get('attemptId');

    if (attemptId) {
      // Получаем конкретную попытку
      const attempt = await prisma.quizAttempt.findUnique({
        where: { id: attemptId },
        include: {
          answers: {
            include: {
              question: {
                select: {
                  id: true,
                  questionText: true,
                  questionImage: true,
                  questionType: true,
                  optionA: true,
                  optionB: true,
                  optionC: true,
                  optionD: true,
                  optionE: true,
                  correctAnswer: true,
                  explanation: true,
                }
              }
            },
            orderBy: { questionOrder: 'asc' }
          }
        }
      });

      if (!attempt) {
        return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
      }

      // Проверяем права доступа
      if (attempt.userId !== session.user.id && session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      return NextResponse.json(attempt);
    } else {
      // Получаем активную попытку пользователя (незавершенную)
      const activeAttempt = await prisma.quizAttempt.findFirst({
        where: {
          userId: session.user.id,
          isCompleted: false
        },
        orderBy: { startedAt: 'desc' }
      });

      return NextResponse.json(activeAttempt);
    }
  } catch (error) {
    console.error('Error fetching attempt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attempt' },
      { status: 500 }
    );
  }
}
