import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// POST /api/quiz/submit - Отправить ответы на тест
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { attemptId, answers, timeSpent } = body;

    if (!attemptId || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'attemptId and answers array are required' },
        { status: 400 }
      );
    }

    // Проверяем, что попытка принадлежит пользователю
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId }
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (attempt.isCompleted) {
      return NextResponse.json(
        { error: 'Attempt already completed' },
        { status: 400 }
      );
    }

    // Получаем правильные ответы для всех вопросов
    const questionIds = answers.map((a: any) => a.questionId);
    const questions = await prisma.quizQuestion.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, correctAnswer: true }
    });

    const correctAnswersMap = new Map(
      questions.map(q => [q.id, q.correctAnswer])
    );

    // Проверяем ответы и создаем записи
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;

    const answerRecords = answers.map((answer: any) => {
      const correctAnswer = correctAnswersMap.get(answer.questionId);
      const isCorrect = answer.userAnswer === correctAnswer;
      const isSkipped = !answer.userAnswer;

      if (isSkipped) {
        skippedCount++;
      } else if (isCorrect) {
        correctCount++;
      } else {
        wrongCount++;
      }

      return {
        attemptId,
        questionId: answer.questionId,
        userAnswer: answer.userAnswer || null,
        isCorrect,
        timeSpent: answer.timeSpent || null,
      };
    });

    // Сохраняем все ответы и обновляем попытку в транзакции
    const score = (correctCount / attempt.totalQuestions) * 100;

    await prisma.$transaction([
      // Создаем записи ответов
      prisma.quizAnswer.createMany({
        data: answerRecords
      }),
      // Обновляем попытку
      prisma.quizAttempt.update({
        where: { id: attemptId },
        data: {
          correctAnswers: correctCount,
          wrongAnswers: wrongCount,
          skippedAnswers: skippedCount,
          score,
          timeSpent,
          completedAt: new Date(),
          isCompleted: true,
        }
      }),
      // Обновляем статистику вопросов
      ...answerRecords.map(answer =>
        prisma.quizQuestion.update({
          where: { id: answer.questionId },
          data: {
            timesCorrect: answer.isCorrect ? { increment: 1 } : undefined,
            timesWrong: !answer.isCorrect && answer.userAnswer ? { increment: 1 } : undefined,
          }
        })
      ),
    ]);

    // Обновляем статистику блока (если это блок)
    if (attempt.blockId) {
      const blockAttempts = await prisma.quizAttempt.findMany({
        where: {
          blockId: attempt.blockId,
          isCompleted: true
        },
        select: { score: true }
      });

      const avgScore = blockAttempts.reduce((sum, a) => sum + a.score, 0) / blockAttempts.length;

      await prisma.quizBlock.update({
        where: { id: attempt.blockId },
        data: {
          totalAttempts: { increment: 1 },
          averageScore: avgScore
        }
      });
    }

    // Возвращаем результаты с правильными ответами
    const results = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: {
          include: {
            question: {
              select: {
                id: true,
                questionText: true,
                questionImage: true,
                optionA: true,
                optionB: true,
                optionC: true,
                optionD: true,
                optionE: true,
                correctAnswer: true,
                explanation: true,
              }
            }
          }
        }
      }
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return NextResponse.json(
      { error: 'Failed to submit quiz' },
      { status: 500 }
    );
  }
}
