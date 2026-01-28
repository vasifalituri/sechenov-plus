import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// GET - Get all external resources (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resources = await prisma.externalResource.findMany({
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ success: true, data: resources });
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

// POST - Create new external resource (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Validation schema
    const schema = z.object({
      title: z.string().min(1, 'Title is required').max(200),
      description: z.string().optional(),
      url: z.string().url('Invalid URL'),
      icon: z.string().max(10).default('🔗'),
      order: z.number().int().default(0),
      isActive: z.boolean().default(true),
    });

    const validatedData = schema.parse(body);

    const resource = await prisma.externalResource.create({
      data: {
        ...validatedData,
        authorId: session.user.id,
      },
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
      message: 'Ресурс успешно создан',
    });
  } catch (error) {
    console.error('Error creating resource:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create resource' },
      { status: 500 }
    );
  }
}
