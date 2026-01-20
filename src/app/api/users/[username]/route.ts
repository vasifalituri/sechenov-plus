import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        fullName: true,
        academicYear: true,
        status: true,
        role: true,
        createdAt: true,
        profileImage: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Get user stats
    const [materials, discussions, comments] = await Promise.all([
      prisma.material.count({ where: { uploadedById: user.id, status: 'APPROVED' } }),
      prisma.discussionThread.count({ where: { authorId: user.id, status: 'APPROVED' } }),
      prisma.comment.count({ where: { authorId: user.id, status: 'APPROVED' } }),
    ]);

    return NextResponse.json({
      success: true,
      data: user,
      stats: {
        materials,
        discussions,
        comments,
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
