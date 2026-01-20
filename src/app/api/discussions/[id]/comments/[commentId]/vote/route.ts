import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type } = await request.json(); // 'UPVOTE' or 'DOWNVOTE'
    
    if (type !== 'UPVOTE' && type !== 'DOWNVOTE') {
      return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 });
    }

    const { commentId } = await params;
    const userId = session.user.id;

    // Check if user already voted
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });

    let upvotesChange = 0;
    let downvotesChange = 0;

    if (existingVote) {
      // User already voted
      if (existingVote.type === type) {
        // Remove vote (toggle off)
        await prisma.vote.delete({
          where: { id: existingVote.id },
        });

        if (type === 'UPVOTE') {
          upvotesChange = -1;
        } else {
          downvotesChange = -1;
        }
      } else {
        // Change vote type
        await prisma.vote.update({
          where: { id: existingVote.id },
          data: { type },
        });

        if (type === 'UPVOTE') {
          upvotesChange = 1;
          downvotesChange = -1;
        } else {
          upvotesChange = -1;
          downvotesChange = 1;
        }
      }
    } else {
      // New vote
      await prisma.vote.create({
        data: {
          userId,
          commentId,
          type,
        },
      });

      if (type === 'UPVOTE') {
        upvotesChange = 1;
      } else {
        downvotesChange = 1;
      }
    }

    // Update comment counts
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        upvotes: { increment: upvotesChange },
        downvotes: { increment: downvotesChange },
      },
      select: {
        upvotes: true,
        downvotes: true,
      },
    });

    return NextResponse.json({
      upvotes: updatedComment.upvotes,
      downvotes: updatedComment.downvotes,
      userVote: existingVote?.type === type ? null : type,
    });
  } catch (error) {
    console.error('Error voting on comment:', error);
    return NextResponse.json(
      { error: 'Failed to vote' },
      { status: 500 }
    );
  }
}

// Get user's vote for a comment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ userVote: null });
    }

    const { commentId } = await params;

    const vote = await prisma.vote.findUnique({
      where: {
        userId_commentId: {
          userId: session.user.id,
          commentId,
        },
      },
    });

    return NextResponse.json({ userVote: vote?.type || null });
  } catch (error) {
    console.error('Error getting vote:', error);
    return NextResponse.json({ userVote: null });
  }
}
