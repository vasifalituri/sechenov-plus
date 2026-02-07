import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/quiz/questions - Получить вопросы с фильтрацией
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const blockId = searchParams.get('blockId');
    const subjectId = searchParams.get('subjectId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');

    const where: any = {};
    
    if (blockId) where.blockId = blockId;
    if (subjectId) where.subjectId = subjectId;
    if (search) {
      where.OR = [
        { questionText: { contains: search, mode: 'insensitive' } },
        { optionA: { contains: search, mode: 'insensitive' } },
        { optionB: { contains: search, mode: 'insensitive' } },
        { optionC: { contains: search, mode: 'insensitive' } },
        { optionD: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [questions, total] = await Promise.all([
      prisma.quizQuestion.findMany({
        where,
        include: {
          subject: true,
          block: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.quizQuestion.count({ where })
    ]);

    return NextResponse.json({
      questions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

// POST /api/admin/quiz/questions - Создать вопрос
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      blockId,
      subjectId,
      questionText,
      questionImage,
      optionA,
      optionB,
      optionC,
      optionD,
      optionE,
      correctAnswer,
      explanation,
      difficulty,
      tags
    } = body;

    // Валидация
    if (!subjectId || !questionText || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['A', 'B', 'C', 'D', 'E'].includes(correctAnswer)) {
      return NextResponse.json(
        { error: 'correctAnswer must be A, B, C, D, or E' },
        { status: 400 }
      );
    }

    const question = await prisma.quizQuestion.create({
      data: {
        blockId: blockId || null,
        subjectId,
        questionText,
        questionImage,
        optionA,
        optionB,
        optionC,
        optionD,
        optionE,
        correctAnswer,
        explanation,
        difficulty: difficulty || 'MEDIUM',
        tags: tags || [],
      },
      include: {
        subject: true,
        block: true
      }
    });

    // Обновить счетчик вопросов в блоке
    if (blockId) {
      await prisma.quizBlock.update({
        where: { id: blockId },
        data: {
          questionCount: { increment: 1 }
        }
      });
    }

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    );
  }
}
