import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Get all announcements (admin only)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const announcements = await prisma.announcement.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { error: 'Ошибка получения объявлений' },
      { status: 500 }
    );
  }
}

// Create new announcement (admin only)
const createSchema = z.object({
  title: z.string().min(1, 'Заголовок обязателен').max(200),
  content: z.string().min(1, 'Содержание обязательно'),
  type: z.enum(['INFO', 'WARNING', 'SUCCESS', 'ERROR']).default('INFO'),
  priority: z.number().int().min(0).max(100).default(0),
  expiresAt: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    console.log('📝 POST /api/admin/announcements - Start');
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      console.log('❌ Access denied - not admin');
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    console.log('👤 Admin user:', session.user.id);
    const body = await req.json();
    console.log('📦 Request body:', body);
    
    const validatedData = createSchema.parse(body);
    console.log('✅ Validation passed:', validatedData);

    const announcement = await prisma.announcement.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        type: validatedData.type,
        priority: validatedData.priority,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
        authorId: session.user.id,
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

    console.log('✅ Announcement created:', announcement.id);
    return NextResponse.json({
      success: true,
      announcement,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Validation error:', error.errors);
      return NextResponse.json(
        { error: 'Неверные данные', details: error.errors },
        { status: 400 }
      );
    }

    console.error('❌ Error creating announcement:', error);
    return NextResponse.json(
      { error: 'Ошибка создания объявления', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
