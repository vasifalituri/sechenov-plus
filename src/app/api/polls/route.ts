import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/polls - Get active polls (public)
export async function GET() {
  try {
    const polls = await prisma.poll.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } },
        ],
      },
      include: {
        options: {
          include: {
            _count: {
              select: { votes: true },
            },
          },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { votes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 1, // Only show the most recent active poll
    });

    return NextResponse.json(polls[0] || null);
  } catch (error) {
    console.error('Error fetching active poll:', error);
    return NextResponse.json({ error: 'Failed to fetch poll' }, { status: 500 });
  }
}
