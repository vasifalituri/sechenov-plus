import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Search users by username or name (for mentions)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    if (query.length < 2) {
      return NextResponse.json([]);
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { status: 'APPROVED' }, // Only approved users
          {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { fullName: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        academicYear: true,
        role: true,
      },
      take: 10, // Limit to 10 results
      orderBy: {
        username: 'asc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
