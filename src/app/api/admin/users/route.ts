import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        academicYear: true,
        status: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, status } = await req.json();

    if (!userId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user has verified email before approving
    if (status === 'APPROVED') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { emailVerified: true, email: true },
      });

      if (!user?.emailVerified) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Невозможно одобрить пользователя. Email не подтвержден.',
            details: 'Пользователь должен подтвердить свой email перед одобрением.' 
          },
          { status: 400 }
        );
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      message: `Пользователь ${status === 'APPROVED' ? 'одобрен' : 'отклонен'}`,
      data: user,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId' },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: 'Пользователь удален',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
