import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/quiz/take - Get quiz attempt data for taking test
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const attemptId = searchParams.get('attemptId');

    if (!attemptId) {
      return NextResponse.json(
        { error: 'attemptId query parameter is required' },
        { status: 400 }
      );
    }

    let attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
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

    // Retry for Neon connection pooling delays
    if (!attempt) {
      for (let i = 0; i < 6; i++) {
        await new Promise((r) => setTimeout(r, 500));
        const retryAttempt = await prisma.quizAttempt.findUnique({
          where: { id: attemptId },
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

        if (retryAttempt) {
          attempt = retryAttempt;
          break;
        }
      }

      if (!attempt) {
        return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
      }
    }

    // Check access rights
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
