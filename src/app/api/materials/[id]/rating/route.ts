import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get average rating and user's rating for a material
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: materialId } = await params;

    // Get average rating and count
    const ratings = await prisma.rating.findMany({
      where: { materialId },
      select: { rating: true },
    });

    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

    const totalRatings = ratings.length;

    // Get user's rating if authenticated
    let userRating: number | null = null;
    if (session) {
      const existingRating = await prisma.rating.findUnique({
        where: {
          userId_materialId: {
            userId: session.user.id,
            materialId,
          },
        },
      });
      userRating = existingRating ? existingRating.rating : null;
    }

    return NextResponse.json({
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalRatings,
      userRating,
    });
  } catch (error) {
    console.error('Get rating error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add or update rating
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: materialId } = await params;
    const body = await request.json();
    const { rating, review } = body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if material exists
    const material = await prisma.material.findUnique({
      where: { id: materialId },
    });

    if (!material) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      );
    }

    // Upsert rating (create or update)
    const ratingRecord = await prisma.rating.upsert({
      where: {
        userId_materialId: {
          userId: session.user.id,
          materialId,
        },
      },
      update: {
        rating,
        review,
      },
      create: {
        userId: session.user.id,
        materialId,
        rating,
        review,
      },
    });

    return NextResponse.json(ratingRecord);
  } catch (error) {
    console.error('Post rating error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove rating
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: materialId } = await params;

    // Delete rating
    await prisma.rating.deleteMany({
      where: {
        userId: session.user.id,
        materialId,
      },
    });

    return NextResponse.json({ message: 'Rating deleted' });
  } catch (error) {
    console.error('Delete rating error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
