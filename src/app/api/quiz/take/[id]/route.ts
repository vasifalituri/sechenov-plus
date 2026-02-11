import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/quiz/take/[id] - load quiz attempt questions for taking the test (without correct answers)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id },
      include: {
        subject: { select: { id: true, name: true, slug: true } },
        block: { select: { id: true, title: true } },
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
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      attemptId: attempt.id,
      mode: attempt.mode,
      totalQuestions: attempt.totalQuestions,
      startedAt: attempt.startedAt,
      subject: attempt.subject,
      block: attempt.block,
      questions: attempt.answers.map((a) => a.question),
    });
  } catch (error) {
    console.error('Error loading quiz take data:', error);
    return NextResponse.json({ error: 'Failed to load quiz' }, { status: 500 });
  }
}
