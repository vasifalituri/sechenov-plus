import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/teachers/reviews/[reviewId] - Модерация отзыва (только для админов/модераторов)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Неверный статус' },
        { status: 400 }
      );
    }

    const review = await prisma.teacherReview.update({
      where: { id: params.reviewId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            profileImage: true,
          },
        },
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error('Error updating review status:', error);
    return NextResponse.json(
      { error: 'Не удалось обновить статус отзыва' },
      { status: 500 }
    );
  }
}

// DELETE /api/teachers/reviews/[reviewId] - Удалить отзыв
export async function DELETE(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const review = await prisma.teacherReview.findUnique({
      where: { id: params.reviewId },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Отзыв не найден' },
        { status: 404 }
      );
    }

    // Пользователь может удалить только свой отзыв, админ/модератор - любой
    const canDelete =
      review.userId === session.user.id ||
      session.user.role === 'ADMIN' ||
      session.user.role === 'MODERATOR';

    if (!canDelete) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
    }

    await prisma.teacherReview.delete({
      where: { id: params.reviewId },
    });

    return NextResponse.json({ message: 'Отзыв удален' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Не удалось удалить отзыв' },
      { status: 500 }
    );
  }
}
