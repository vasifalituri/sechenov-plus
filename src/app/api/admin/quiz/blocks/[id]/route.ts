import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/quiz/blocks/[id] - Получить блок по ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const block = await prisma.quizBlock.findUnique({
      where: { id: params.id },
      include: {
        subject: true,
        questions: {
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: { questions: true, attempts: true }
        }
      }
    });

    if (!block) {
      return NextResponse.json({ error: 'Block not found' }, { status: 404 });
    }

    return NextResponse.json(block);
  } catch (error) {
    console.error('Error fetching quiz block:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz block' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/quiz/blocks/[id] - Обновить блок
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, difficulty, isActive, orderIndex } = body;

    const block = await prisma.quizBlock.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(difficulty !== undefined && { difficulty }),
        ...(isActive !== undefined && { isActive }),
        ...(orderIndex !== undefined && { orderIndex }),
      },
      include: {
        subject: true
      }
    });

    return NextResponse.json(block);
  } catch (error) {
    console.error('Error updating quiz block:', error);
    return NextResponse.json(
      { error: 'Failed to update quiz block' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/quiz/blocks/[id] - Удалить блок
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.quizBlock.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting quiz block:', error);
    return NextResponse.json(
      { error: 'Failed to delete quiz block' },
      { status: 500 }
    );
  }
}
