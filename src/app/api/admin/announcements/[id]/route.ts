import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Update announcement
const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  type: z.enum(['INFO', 'WARNING', 'SUCCESS', 'ERROR']).optional(),
  priority: z.number().int().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().nullable().optional().transform(val => val === '' ? null : val),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = updateSchema.parse(body);
    const { id } = await params;

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        ...validatedData,
        expiresAt: validatedData.expiresAt
          ? validatedData.expiresAt === null
            ? null
            : new Date(validatedData.expiresAt)
          : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      announcement,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Неверные данные', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating announcement:', error);
    return NextResponse.json(
      { error: 'Ошибка обновления объявления' },
      { status: 500 }
    );
  }
}

// Delete announcement
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    const { id } = await params;

    await prisma.announcement.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Объявление удалено',
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json(
      { error: 'Ошибка удаления объявления' },
      { status: 500 }
    );
  }
}
