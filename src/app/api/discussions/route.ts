import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { safeJsonParse } from '@/lib/body-validator';
import { logger } from '@/lib/logger';

// GET - List discussion threads with filters
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const academicYear = searchParams.get('academicYear');
    const subjectId = searchParams.get('subjectId');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'popular'; // popular, new

    interface DiscussionWhereInput {
      status: 'APPROVED' | 'PENDING' | 'REJECTED';
      academicYear?: number;
      subjectId?: string;
      createdAt?: { gte: Date };
      OR?: Array<{
        title?: { contains: string; mode: 'insensitive' };
        content?: { contains: string; mode: 'insensitive' };
      }>;
    }

    const where: DiscussionWhereInput = { status: 'APPROVED' as const };

    if (academicYear) {
      where.academicYear = parseInt(academicYear);
    }

    if (subjectId) {
      where.subjectId = subjectId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Determine sorting and filtering based on sort type
    interface OrderByInput {
      isPinned?: 'desc' | 'asc';
      createdAt?: 'desc' | 'asc';
    }
    
    const orderBy: OrderByInput[] = [{ isPinned: 'desc' }];
    
    if (sort === 'new') {
      // New: discussions from last week, sorted by creation date
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      where.createdAt = { gte: oneWeekAgo };
      orderBy.push({ createdAt: 'desc' });
    } else {
      // Popular: discussions from last month with complex scoring
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
      where.createdAt = { gte: oneMonthAgo };
      // Will sort by calculated popularity score in application code
    }

    const threads = await prisma.discussionThread.findMany({
      where,
      include: {
        subject: true,
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
            academicYear: true,
            profileImage: true,
          },
        },
        votes: {
          where: { userId: session.user.id },
          select: { type: true },
        },
        _count: {
          select: {
            comments: { where: { status: 'APPROVED' } },
          },
        },
      },
      orderBy,
      take: 50, // Limit to 50 discussions for performance
    });

    // Transform to include user vote and calculate popularity score
    let threadsWithVotes = threads.map(thread => {
      const score = thread.upvotes - thread.downvotes;
      const commentCount = thread._count.comments;
      
      // Calculate recency factor (0-1, where 1 is most recent)
      const daysSinceCreation = (Date.now() - new Date(thread.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      const recencyFactor = Math.max(0, 1 - (daysSinceCreation / 30)); // Decay over 30 days
      
      // Popularity score = (votes * 1) + (comments * 2) + (recency bonus * 10)
      const popularityScore = (score * 1) + (commentCount * 2) + (recencyFactor * 10);
      
      return {
        ...thread,
        userVote: thread.votes.length > 0 ? thread.votes[0].type : null,
        votes: undefined, // Remove the votes array
        score,
        popularityScore,
      };
    });

    // Sort by popularity score if not sorting by new
    if (sort === 'popular') {
      threadsWithVotes = threadsWithVotes.sort((a, b) => {
        // Pinned threads always first
        if (a.isPinned !== b.isPinned) {
          return a.isPinned ? -1 : 1;
        }
        // Then by popularity score
        return b.popularityScore - a.popularityScore;
      });
    }

    return NextResponse.json({ success: true, data: threadsWithVotes });
  } catch (error) {
    logger.error('Error fetching discussions', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch discussions' },
      { status: 500 }
    );
  }
}

// POST - Create discussion thread
const createThreadSchema = z.object({
  title: z.string().min(5, 'Заголовок должен содержать минимум 5 символов'),
  content: z.string().min(10, 'Содержание должно содержать минимум 10 символов'),
  subjectId: z.string(),
  academicYear: z.number().min(1).max(6),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate body size (max 100KB for discussions)
    const parseResult = await safeJsonParse(req, 100);
    if (!parseResult.success) {
      return parseResult.error;
    }

    const validatedData = createThreadSchema.parse(parseResult.data);

    const thread = await prisma.discussionThread.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        subjectId: validatedData.subjectId,
        academicYear: validatedData.academicYear,
        authorId: session.user.id,
        status: 'APPROVED',
      },
      include: {
        subject: true,
        author: {
          select: {
            fullName: true,
            academicYear: true,
            profileImage: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Обсуждение успешно создано!',
      data: thread,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    logger.error('Error creating discussion', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create discussion' },
      { status: 500 }
    );
  }
}
