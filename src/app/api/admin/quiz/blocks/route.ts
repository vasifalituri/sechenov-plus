import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET /api/admin/quiz/blocks - Получить все блоки
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subjectId');

    const blocks = await prisma.quizBlock.findMany({
      where: subjectId ? { subjectId } : {},
      include: {
        subject: true,
        _count: {
          select: { questions: true, attempts: true }
        }
      },
      orderBy: [
        { orderIndex: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(blocks);
  } catch (error) {
    console.error('Error fetching quiz blocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz blocks' },
      { status: 500 }
    );
  }
}

// POST /api/admin/quiz/blocks - Создать новый блок
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, subjectId, difficulty, orderIndex } = body;

    if (!title || !subjectId) {
      return NextResponse.json(
        { error: 'Title and subjectId are required' },
        { status: 400 }
      );
    }

    const block = await prisma.quizBlock.create({
      data: {
        title,
        description,
        subjectId,
        difficulty: difficulty || 'MEDIUM',
        orderIndex: orderIndex || 0,
      },
      include: {
        subject: true
      }
    });

    return NextResponse.json(block, { status: 201 });
  } catch (error) {
    console.error('Error creating quiz block:', error);
    return NextResponse.json(
      { error: 'Failed to create quiz block' },
      { status: 500 }
    );
  }
}
