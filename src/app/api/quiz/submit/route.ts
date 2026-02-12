import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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
      const isSkipped = !answer.userAnswer;
      
      // Для множественных ответов нужно сравнивать отсортированные строки
      let isCorrect = false;
      if (answer.userAnswer && correctAnswer) {
        const userAnswerSorted = answer.userAnswer.split(',').sort().join(',');
        const correctAnswerSorted = correctAnswer.split(',').sort().join(',');
        isCorrect = userAnswerSorted === correctAnswerSorted;
      }

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

    console.log(`📊 [Quiz Submit] Updating ${answerRecords.length} answers for attempt ${attemptId}`);

    try {
      // Используем транзакцию для надежности
      await prisma.$transaction(async (tx) => {
        // 1. Обновляем ответы по одному (с лучшей обработкой ошибок)
        for (const answer of answerRecords) {
          await tx.quizAnswer.update({
            where: {
              attemptId_questionId: {
                attemptId,
                questionId: answer.questionId
              }
            },
            data: {
              userAnswer: answer.userAnswer,
              isCorrect: answer.isCorrect,
              timeSpent: answer.timeSpent
            }
          });
        }

        // 2. Обновляем попытку
        await tx.quizAttempt.update({
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
        });

        // 3. Обновляем статистику вопросов
        for (const answer of answerRecords) {
          if (answer.isCorrect || answer.userAnswer) {
            await tx.quizQuestion.update({
              where: { id: answer.questionId },
              data: {
                ...(answer.isCorrect ? { timesCorrect: { increment: 1 } } : {}),
                ...(!answer.isCorrect && answer.userAnswer ? { timesWrong: { increment: 1 } } : {}),
              }
            });
          }
        }

        // 4. Обновляем статистику блока (если это блок)
        if (attempt.blockId) {
          const blockAttempts = await tx.quizAttempt.findMany({
            where: {
              blockId: attempt.blockId,
              isCompleted: true
            },
            select: { score: true }
          });

          if (blockAttempts.length > 0) {
            const avgScore = blockAttempts.reduce((sum, a) => sum + a.score, 0) / blockAttempts.length;

            await tx.quizBlock.update({
              where: { id: attempt.blockId },
              data: {
                totalAttempts: { increment: 1 },
                averageScore: avgScore
              }
            });
          }
        }
      });
    } catch (transactionError) {
      console.error('❌ [Quiz Submit] Transaction error:', transactionError);
      throw transactionError;
    }

    console.log(`✅ [Quiz Submit] Successfully submitted attempt ${attemptId}`);

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
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Stack trace:', error instanceof Error ? error.stack : '');
    return NextResponse.json(
      { 
        error: 'Failed to submit quiz',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
