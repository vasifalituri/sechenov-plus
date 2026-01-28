import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// PUT - Update external resource (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    // Validation schema
    const schema = z.object({
      title: z.string().min(1, 'Title is required').max(200).optional(),
      description: z.string().optional(),
      url: z.string().url('Invalid URL').optional(),
      icon: z.string().max(10).optional(),
      order: z.number().int().optional(),
      isActive: z.boolean().optional(),
    });

    const validatedData = schema.parse(body);

    const resource = await prisma.externalResource.update({
      where: { id },
      data: validatedData,
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: resource,
      message: 'Ресурс успешно обновлен',
    });
  } catch (error) {
    console.error('Error updating resource:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update resource' },
      { status: 500 }
    );
  }
}

// DELETE - Delete external resource (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    await prisma.externalResource.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Ресурс успешно удален',
    });
  } catch (error) {
    console.error('Error deleting resource:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete resource' },
      { status: 500 }
    );
  }
}
