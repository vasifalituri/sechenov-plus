import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/polls/vote - Vote on a poll
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { pollId, optionId } = body;

    if (!pollId || !optionId) {
      return NextResponse.json(
        { error: 'Poll ID and Option ID are required' },
        { status: 400 }
      );
    }

    // Check if poll exists and is active
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: true },
    });

    if (!poll || !poll.isActive) {
      return NextResponse.json({ error: 'Poll not found or inactive' }, { status: 404 });
    }

    // Check if poll has expired
    if (poll.expiresAt && new Date(poll.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Poll has expired' }, { status: 400 });
    }

    // Check if user already voted
    const existingVote = await prisma.pollVote.findFirst({
      where: {
        pollId,
        userId: session.user.id,
      },
    });

    if (existingVote && !poll.isMultiple) {
      // If not multiple choice, delete old vote
      await prisma.pollVote.delete({
        where: { id: existingVote.id },
      });
    }

    // Create new vote
    await prisma.pollVote.create({
      data: {
        pollId,
        optionId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error voting on poll:', error);
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
  }
}

// GET /api/polls/vote - Get user's vote for a poll
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const pollId = searchParams.get('pollId');

    if (!pollId) {
      return NextResponse.json({ error: 'Poll ID is required' }, { status: 400 });
    }

    const votes = await prisma.pollVote.findMany({
      where: {
        pollId,
        userId: session.user.id,
      },
      select: {
        optionId: true,
      },
    });

    return NextResponse.json(votes.map(v => v.optionId));
  } catch (error) {
    console.error('Error fetching user vote:', error);
    return NextResponse.json({ error: 'Failed to fetch vote' }, { status: 500 });
  }
}
