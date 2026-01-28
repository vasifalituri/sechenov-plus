import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// PUT - Update user role (ADMIN only can promote/demote moderators)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Only ADMIN can change roles
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Only admins can manage roles.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    // Validation schema
    const schema = z.object({
      role: z.enum(['USER', 'MODERATOR', 'ADMIN']),
    });

    const validatedData = schema.parse(body);

    // Prevent self-demotion
    if (id === session.user.id && validatedData.role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'You cannot change your own admin role.' 
      }, { status: 400 });
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, fullName: true, username: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent demoting other admins (only admin can demote themselves, but we blocked that above)
    if (targetUser.role === 'ADMIN' && validatedData.role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Cannot demote other administrators. Admins can only demote themselves.' 
      }, { status: 403 });
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: validatedData.role },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        email: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: `User role updated to ${validatedData.role}`,
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update user role' },
      { status: 500 }
    );
  }
}
