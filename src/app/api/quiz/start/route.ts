import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/quiz/start - Начать новый тест
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { mode, blockId, subjectId } = body;

    console.log(`🎯 [Quiz Start] Received request - mode: ${mode}, blockId: ${blockId}, subjectId: ${subjectId}`);

    if (!mode || (mode === 'BLOCK' && !blockId) || (mode === 'RANDOM_30' && !subjectId)) {
      console.error('❌ [Quiz Start] Invalid input - missing required fields');
      return NextResponse.json(
        { error: 'mode and blockId (for BLOCK) or subjectId (for RANDOM_30) are required' },
        { status: 400 }
      );
    }

    let questions: any[] = [];

    if (mode === 'BLOCK') {
      // Получаем вопросы из блока
      questions = await prisma.quizQuestion.findMany({
        where: {
          blockId: blockId,
          isActive: true
        },
        select: {
          id: true,
          questionText: true,
          questionImage: true,
          optionA: true,
          optionB: true,
          optionC: true,
          optionD: true,
          optionE: true,
          difficulty: true,
          questionType: true
        }
      });

      console.log(`🎯 [Quiz Start] Found ${questions.length} questions in block ${blockId}`);
    } else if (mode === 'RANDOM_30') {
      // Получаем 30 случайных вопросов из предмета
      const allQuestions = await prisma.quizQuestion.findMany({
        where: {
          subjectId: subjectId,
          isActive: true
        },
        select: {
          id: true,
          questionText: true,
          questionImage: true,
          optionA: true,
          optionB: true,
          optionC: true,
          optionD: true,
          optionE: true,
          difficulty: true,
          questionType: true
        }
      });

      console.log(`🎯 [Quiz Start] Found ${allQuestions.length} total questions in subject ${subjectId}`);

      // Перемешиваем и берем первые 30
      questions = allQuestions
        .sort(() => Math.random() - 0.5)
        .slice(0, 30);

      console.log(`🎯 [Quiz Start] Selected ${questions.length} random questions`);
    }

    if (questions.length === 0) {
      console.error('❌ [Quiz Start] No questions found');
      return NextResponse.json(
        { error: 'No questions found for this mode' },
        { status: 404 }
      );
    }

    // Создаем новую попытку
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: session.user.id,
        mode: mode as 'RANDOM_30' | 'BLOCK',
        blockId: mode === 'BLOCK' ? blockId : null,
        subjectId: mode === 'RANDOM_30' ? subjectId : null,
        totalQuestions: questions.length,
        correctAnswers: 0,
        wrongAnswers: 0,
        skippedAnswers: 0,
        score: 0,
        isCompleted: false
      }
    });

    console.log(`✅ [Quiz Start] Attempt created - id: ${attempt.id}, totalQuestions: ${attempt.totalQuestions}`);

    // Возвращаем данные для начала теста
    return NextResponse.json({
      attemptId: attempt.id,
      mode: attempt.mode,
      questions: questions.map((q, index) => ({
        id: q.id,
        questionText: q.questionText,
        questionImage: q.questionImage,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        optionE: q.optionE,
        difficulty: q.difficulty,
        questionType: q.questionType,
        questionOrder: index
      })),
      totalQuestions: questions.length
    });
  } catch (error) {
    console.error('❌ [Quiz Start] Error:', error);
    return NextResponse.json(
      { error: 'Failed to start quiz' },
      { status: 500 }
    );
  }
}
