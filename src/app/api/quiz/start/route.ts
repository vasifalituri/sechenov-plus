import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// POST /api/quiz/start - Начать прохождение теста
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { mode, blockId, subjectId } = body;

    // Валидация режима
    if (!mode || !['RANDOM_30', 'BLOCK'].includes(mode)) {
      return NextResponse.json(
        { error: 'mode must be RANDOM_30 or BLOCK' },
        { status: 400 }
      );
    }

    // Валидация параметров для каждого режима
    if (mode === 'BLOCK' && !blockId) {
      return NextResponse.json(
        { error: 'blockId is required for BLOCK mode' },
        { status: 400 }
      );
    }

    if (mode === 'RANDOM_30' && !subjectId) {
      return NextResponse.json(
        { error: 'subjectId is required for RANDOM_30 mode' },
        { status: 400 }
      );
    }

    // Получаем вопросы в зависимости от режима
    let questions;
    let totalQuestions;

    if (mode === 'RANDOM_30') {
      // Режим 1: 30 случайных вопросов из предмета
      questions = await prisma.$queryRaw<any[]>`
        SELECT * FROM quiz_questions
        WHERE subject_id = ${subjectId}
        AND is_active = true
        ORDER BY RANDOM()
        LIMIT 30
      `;
      totalQuestions = 30;
    } else {
      // Режим 2: Все вопросы из блока
      const block = await prisma.quizBlock.findUnique({
        where: { id: blockId },
        include: {
          questions: {
            where: { isActive: true },
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      if (!block) {
        return NextResponse.json({ error: 'Block not found' }, { status: 404 });
      }

      if (!block.isActive) {
        return NextResponse.json({ error: 'Block is not active' }, { status: 400 });
      }

      questions = block.questions;
      totalQuestions = questions.length;
    }

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'No questions available' },
        { status: 400 }
      );
    }

    // Создаем попытку
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: session.user.id,
        mode,
        blockId: mode === 'BLOCK' ? blockId : null,
        subjectId: mode === 'RANDOM_30' ? subjectId : null,
        totalQuestions,
        correctAnswers: 0,
        wrongAnswers: 0,
        skippedAnswers: 0,
        score: 0,
        isCompleted: false,
      }
    });

    // Обновляем статистику показов вопросов
    const questionIds = questions.map((q: any) => q.id);
    await prisma.quizQuestion.updateMany({
      where: { id: { in: questionIds } },
      data: { timesShown: { increment: 1 } }
    });

    // Возвращаем попытку и вопросы (без правильных ответов!)
    const questionsForStudent = questions.map((q: any) => ({
      id: q.id,
      questionText: q.questionText || q.question_text,
      questionImage: q.questionImage || q.question_image,
      optionA: q.optionA || q.option_a,
      optionB: q.optionB || q.option_b,
      optionC: q.optionC || q.option_c,
      optionD: q.optionD || q.option_d,
      optionE: q.optionE || q.option_e,
      // НЕ отправляем correctAnswer и explanation!
    }));

    return NextResponse.json({
      attemptId: attempt.id,
      mode: attempt.mode,
      totalQuestions: attempt.totalQuestions,
      questions: questionsForStudent,
      startedAt: attempt.startedAt,
    });
  } catch (error) {
    console.error('Error starting quiz:', error);
    return NextResponse.json(
      { error: 'Failed to start quiz' },
      { status: 500 }
    );
  }
}
