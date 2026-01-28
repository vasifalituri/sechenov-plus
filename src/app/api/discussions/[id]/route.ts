import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get single thread with comments
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || session.user.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const thread = await prisma.discussionThread.findUnique({
      where: { id },
      include: {
        subject: true,
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
            academicYear: true,
            profileImage: true,
            role: true,
          },
        },
        votes: {
          where: { userId: session.user.id },
          select: { type: true },
        },
        comments: {
          where: {
            status: 'APPROVED',
            parentId: null, // Only top-level comments
          },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                fullName: true,
                academicYear: true,
                profileImage: true,
                role: true,
              },
            },
            votes: {
              where: { userId: session.user.id },
              select: { type: true },
            },
            replies: {
              where: { status: 'APPROVED' },
              include: {
                author: {
                  select: {
                    id: true,
                    username: true,
                    fullName: true,
                    academicYear: true,
                    profileImage: true,
                    role: true,
                  },
                },
                votes: {
                  where: { userId: session.user.id },
                  select: { type: true },
                },
                replies: {
                  where: { status: 'APPROVED' },
                  include: {
                    author: {
                      select: {
                        id: true,
                        username: true,
                        fullName: true,
                        academicYear: true,
                        profileImage: true,
                        role: true,
                      },
                    },
                    votes: {
                      where: { userId: session.user.id },
                      select: { type: true },
                    },
                  },
                  orderBy: [
                    { isPinned: 'desc' },
                    { upvotes: 'desc' },
                    { createdAt: 'asc' },
                  ],
                },
              },
              orderBy: [
                { isPinned: 'desc' },
                { upvotes: 'desc' },
                { createdAt: 'asc' },
              ],
            },
          },
          orderBy: [
            { isPinned: 'desc' },
            { upvotes: 'desc' },
            { createdAt: 'desc' },
          ],
        },
        _count: {
          select: {
            comments: { where: { status: 'APPROVED' } },
          },
        },
      },
    });

    if (!thread || thread.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Transform to include userVote flags recursively
    const addVoteFlag = (item: any) => ({
      ...item,
      userVote: item.votes?.length > 0 ? item.votes[0].type : null,
      votes: undefined,
      score: item.upvotes - item.downvotes,
      replies: item.replies?.map(addVoteFlag),
    });

    const threadWithVotes = {
      ...thread,
      userVote: thread.votes.length > 0 ? thread.votes[0].type : null,
      votes: undefined,
      score: thread.upvotes - thread.downvotes,
      comments: thread.comments.map(addVoteFlag),
    };

    return NextResponse.json({ success: true, data: threadWithVotes });
  } catch (error) {
    console.error('Error fetching thread:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch thread' },
      { status: 500 }
    );
  }
}

// DELETE - Delete discussion thread (admin only)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete thread (cascade will delete comments and likes)
    await prisma.discussionThread.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Discussion deleted successfully',
    });
  } catch (error) {
    console.error('Error fetching thread:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch thread' },
      { status: 500 }
    );
  }
}
