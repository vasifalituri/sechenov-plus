import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/teachers/reviews/[reviewId]/helpful - Отметить отзыв как полезный/бесполезный
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Для новой логики нам не нужно передавать isHelpful в body
    // Просто ставим лайк

    // Проверяем существование отзыва
    const review = await prisma.teacherReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Отзыв не найден' },
        { status: 404 }
      );
    }

    // Проверяем, не оценивал ли пользователь уже этот отзыв
    const existing = await prisma.teacherReviewHelpful.findUnique({
      where: {
        reviewId_userId: {
          reviewId: reviewId,
          userId: session.user.id,
        },
      },
    });

    if (existing) {
      // Пользователь уже поставил лайк, не разрешаем еще один
      return NextResponse.json(
        { error: 'Вы уже поставили лайк этому отзыву' },
        { status: 400 }
      );
    }

    // Создаем новый лайк
    await prisma.teacherReviewHelpful.create({
      data: {
        reviewId: reviewId,
        userId: session.user.id,
        isHelpful: true,
      },
    });

    // Увеличиваем счетчик лайков в отзыве
    await prisma.teacherReview.update({
      where: { id: reviewId },
      data: {
        helpfulCount: { increment: 1 },
      },
    });

    // Получаем обновленный отзыв
    const updatedReview = await prisma.teacherReview.findUnique({
      where: { id: reviewId },
      include: {
        helpfulness: {
          where: {
            userId: session.user.id,
          },
        },
      },
    });

    return NextResponse.json(updatedReview);
  } catch (error) {
    console.error('Error marking review helpful:', error);
    return NextResponse.json(
      { error: 'Не удалось оценить отзыв' },
      { status: 500 }
    );
  }
}
