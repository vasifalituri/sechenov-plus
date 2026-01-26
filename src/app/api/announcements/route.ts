import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get active announcements (public - for homepage)
export async function GET() {
  try {
    const now = new Date();

    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        priority: true,
        createdAt: true,
        author: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 10, // Limit to 10 announcements
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
