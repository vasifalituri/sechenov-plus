import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/quiz/questions/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const question = await prisma.quizQuestion.findUnique({
      where: { id },
      include: {
        subject: true,
        block: true
      }
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/quiz/questions/[id] - Обновить вопрос
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const question = await prisma.quizQuestion.update({
      where: { id },
      data: {
        ...(body.blockId !== undefined && { blockId: body.blockId }),
        ...(body.subjectId !== undefined && { subjectId: body.subjectId }),
        ...(body.questionText !== undefined && { questionText: body.questionText }),
        ...(body.questionImage !== undefined && { questionImage: body.questionImage }),
        ...(body.optionA !== undefined && { optionA: body.optionA }),
        ...(body.optionB !== undefined && { optionB: body.optionB }),
        ...(body.optionC !== undefined && { optionC: body.optionC }),
        ...(body.optionD !== undefined && { optionD: body.optionD }),
        ...(body.optionE !== undefined && { optionE: body.optionE }),
        ...(body.correctAnswer !== undefined && { correctAnswer: body.correctAnswer }),
        ...(body.explanation !== undefined && { explanation: body.explanation }),
        ...(body.difficulty !== undefined && { difficulty: body.difficulty }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.tags !== undefined && { tags: body.tags }),
      },
      include: {
        subject: true,
        block: true
      }
    });

    return NextResponse.json(question);
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/quiz/questions/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const question = await prisma.quizQuestion.findUnique({
      where: { id },
      select: { blockId: true }
    });

    await prisma.quizQuestion.delete({
      where: { id }
    });

    // Обновить счетчик вопросов в блоке
    if (question?.blockId) {
      await prisma.quizBlock.update({
        where: { id: question.blockId },
        data: {
          questionCount: { decrement: 1 }
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { error: 'Failed to delete question' },
      { status: 500 }
    );
  }
}
