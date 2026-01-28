import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // all, materials, discussions
    const limit = parseInt(searchParams.get('limit') || '10');

    if (query.length < 2) {
      return NextResponse.json({ 
        materials: [], 
        discussions: [],
        total: 0 
      });
    }

    const results: {
      materials: any[];
      discussions: any[];
      total: number;
    } = {
      materials: [],
      discussions: [],
      total: 0,
    };

    // Search Materials
    if (type === 'all' || type === 'materials') {
      const materials = await prisma.material.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
            },
          },
          uploadedBy: {
            select: {
              id: true,
              fullName: true,
              username: true,
              profileImage: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });

      results.materials = materials.map((material) => ({
        id: material.id,
        title: material.title,
        description: material.description,
        type: 'material',
        subject: material.subject.name,
        uploadedBy: material.uploadedBy.fullName,
        authorRole: material.uploadedBy.role,
        createdAt: material.createdAt,
        url: `/materials/${material.id}`,
      }));

      results.total += materials.length;
    }

    // Search Discussions
    if (type === 'all' || type === 'discussions') {
      const discussions = await prisma.discussionThread.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              username: true,
              profileImage: true,
              role: true,
            },
          },
          subject: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });

      results.discussions = discussions.map((discussion) => ({
        id: discussion.id,
        title: discussion.title,
        content: discussion.content,
        type: 'discussion',
        subject: discussion.subject?.name,
        author: discussion.author.fullName,
        authorRole: discussion.author.role,
        commentsCount: discussion._count.comments,
        createdAt: discussion.createdAt,
        url: `/discussions/${discussion.id}`,
      }));

      results.total += discussions.length;
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
