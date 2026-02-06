import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// POST /api/admin/quiz/questions/bulk-import - Массовый импорт вопросов
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { questions, blockId, subjectId } = body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'questions must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!subjectId) {
      return NextResponse.json(
        { error: 'subjectId is required' },
        { status: 400 }
      );
    }

    // Валидация всех вопросов перед импортом
    const errors: string[] = [];
    questions.forEach((q, index) => {
      if (!q.questionText) errors.push(`Question ${index + 1}: missing questionText`);
      if (!q.optionA) errors.push(`Question ${index + 1}: missing optionA`);
      if (!q.optionB) errors.push(`Question ${index + 1}: missing optionB`);
      if (!q.optionC) errors.push(`Question ${index + 1}: missing optionC`);
      if (!q.optionD) errors.push(`Question ${index + 1}: missing optionD`);
      if (!q.correctAnswer) errors.push(`Question ${index + 1}: missing correctAnswer`);
      if (q.correctAnswer && !['A', 'B', 'C', 'D', 'E'].includes(q.correctAnswer)) {
        errors.push(`Question ${index + 1}: correctAnswer must be A, B, C, D, or E`);
      }
    });

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    // Создаем все вопросы
    const createdQuestions = await prisma.$transaction(
      questions.map(q =>
        prisma.quizQuestion.create({
          data: {
            blockId: blockId || null,
            subjectId,
            questionText: q.questionText,
            questionImage: q.questionImage || null,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            optionE: q.optionE || null,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || null,
            difficulty: q.difficulty || 'MEDIUM',
            tags: q.tags || [],
          }
        })
      )
    );

    // Обновляем счетчик вопросов в блоке
    if (blockId) {
      await prisma.quizBlock.update({
        where: { id: blockId },
        data: {
          questionCount: { increment: createdQuestions.length }
        }
      });
    }

    return NextResponse.json({
      success: true,
      imported: createdQuestions.length,
      questions: createdQuestions
    }, { status: 201 });
  } catch (error) {
    console.error('Error bulk importing questions:', error);
    return NextResponse.json(
      { error: 'Failed to import questions' },
      { status: 500 }
    );
  }
}
