import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get all bookmarks for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // 'MATERIAL' or 'DISCUSSION' or null (all)

    const where: any = {
      userId: session.user.id,
    };

    if (type) {
      where.type = type;
    }

    const bookmarks = await prisma.bookmark.findMany({
      where,
      include: {
        material: {
          include: {
            subject: true,
            uploadedBy: {
              select: {
                id: true,
                fullName: true,
                username: true,
                profileImage: true,
              },
            },
          },
        },
        discussion: {
          include: {
            subject: true,
            author: {
              select: {
                id: true,
                fullName: true,
                username: true,
                profileImage: true,
                role: true,
              },
            },
            _count: {
              select: {
                comments: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(bookmarks);
  } catch (error) {
    console.error('Get bookmarks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add a bookmark
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, materialId, discussionId, note } = body;

    // Validate input
    if (!type || (type !== 'MATERIAL' && type !== 'DISCUSSION')) {
      return NextResponse.json(
        { error: 'Invalid bookmark type' },
        { status: 400 }
      );
    }

    if (type === 'MATERIAL' && !materialId) {
      return NextResponse.json(
        { error: 'Material ID is required' },
        { status: 400 }
      );
    }

    if (type === 'DISCUSSION' && !discussionId) {
      return NextResponse.json(
        { error: 'Discussion ID is required' },
        { status: 400 }
      );
    }

    // Check if bookmark already exists
    const existingBookmark = await prisma.bookmark.findFirst({
      where: {
        userId: session.user.id,
        ...(type === 'MATERIAL' 
          ? { materialId } 
          : { discussionId }
        ),
      },
    });

    if (existingBookmark) {
      return NextResponse.json(
        { error: 'Bookmark already exists' },
        { status: 409 }
      );
    }

    // Create bookmark
    const bookmark = await prisma.bookmark.create({
      data: {
        userId: session.user.id,
        type,
        materialId: type === 'MATERIAL' ? materialId : null,
        discussionId: type === 'DISCUSSION' ? discussionId : null,
        note,
      },
      include: {
        material: {
          include: {
            subject: true,
          },
        },
        discussion: {
          include: {
            subject: true,
          },
        },
      },
    });

    return NextResponse.json(bookmark, { status: 201 });
  } catch (error) {
    console.error('Create bookmark error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
