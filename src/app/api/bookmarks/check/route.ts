import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Check if item is bookmarked
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const materialId = searchParams.get('materialId');
    const discussionId = searchParams.get('discussionId');

    if (!materialId && !discussionId) {
      return NextResponse.json(
        { error: 'Material ID or Discussion ID is required' },
        { status: 400 }
      );
    }

    const bookmark = await prisma.bookmark.findFirst({
      where: {
        userId: session.user.id,
        ...(materialId ? { materialId } : { discussionId }),
      },
    });

    return NextResponse.json({
      isBookmarked: !!bookmark,
      bookmarkId: bookmark?.id || null,
    });
  } catch (error) {
    console.error('Check bookmark error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
