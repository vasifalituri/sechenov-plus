import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Toggle pin on discussion thread (admin only)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current pin status
    const thread = await prisma.discussionThread.findUnique({
      where: { id },
      select: { isPinned: true },
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Toggle pin status
    await prisma.discussionThread.update({
      where: { id },
      data: { isPinned: !thread.isPinned },
    });

    return NextResponse.json({
      success: true,
      isPinned: !thread.isPinned,
      message: thread.isPinned ? 'Discussion unpinned' : 'Discussion pinned',
    });
  } catch (error) {
    console.error('Error toggling thread pin:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle pin' },
      { status: 500 }
    );
  }
}
