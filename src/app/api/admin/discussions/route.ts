import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const threads = await prisma.discussionThread.findMany({
      include: {
        subject: true,
        author: {
          select: {
            fullName: true,
            email: true,
            profileImage: true,
          },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: threads });
  } catch (error) {
    console.error('Error fetching discussions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch discussions' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { threadId, status, isPinned } = await req.json();

    if (!threadId) {
      return NextResponse.json(
        { success: false, error: 'Missing threadId' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      updateData.approvedById = status === 'APPROVED' ? session.user.id : null;
    }
    if (typeof isPinned === 'boolean') {
      updateData.isPinned = isPinned;
    }

    const thread = await prisma.discussionThread.update({
      where: { id: threadId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Обсуждение обновлено',
      data: thread,
    });
  } catch (error) {
    console.error('Error updating discussion:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update discussion' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get('threadId');

    if (!threadId) {
      return NextResponse.json(
        { success: false, error: 'Missing threadId' },
        { status: 400 }
      );
    }

    await prisma.discussionThread.delete({
      where: { id: threadId },
    });

    return NextResponse.json({
      success: true,
      message: 'Обсуждение удалено',
    });
  } catch (error) {
    console.error('Error deleting discussion:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete discussion' },
      { status: 500 }
    );
  }
}
