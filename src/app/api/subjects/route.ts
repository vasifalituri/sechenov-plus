import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const slugParam = req.nextUrl.searchParams.get('slug');

    // If slug is provided, resolve a single subject by slug (case-insensitive) or by id
    if (slugParam) {
      let decoded = slugParam;
      try {
        decoded = decodeURIComponent(slugParam);
      } catch {
        // ignore
      }
      const cleaned = decoded.trim();

      const subject = await prisma.subject.findFirst({
        where: {
          OR: [
            { id: cleaned },
            { slug: { equals: cleaned, mode: 'insensitive' } },
            // Try encoded variant too (helps if slugs were stored encoded)
            { slug: { equals: encodeURIComponent(cleaned), mode: 'insensitive' } },
          ],
        },
        include: {
          _count: {
            select: {
              quizBlocks: true,
              quizQuestions: true,
            },
          },
        },
      });

      if (!subject) {
        return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
      }

      return NextResponse.json(subject);
    }

    // Default: return list
    const subjects = await prisma.subject.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: {
            quizBlocks: true,
            quizQuestions: true,
          },
        },
      },
    });

    return NextResponse.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch subjects' }, { status: 500 });
  }
}
