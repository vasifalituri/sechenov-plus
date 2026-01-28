import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Toggle pin on comment (admin only)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current pin status
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { isPinned: true },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Toggle pin status
    await prisma.comment.update({
      where: { id: commentId },
      data: { isPinned: !comment.isPinned },
    });

    return NextResponse.json({
      success: true,
      isPinned: !comment.isPinned,
      message: comment.isPinned ? 'Comment unpinned' : 'Comment pinned',
    });
  } catch (error) {
    console.error('Error toggling comment pin:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle pin' },
      { status: 500 }
    );
  }
}
