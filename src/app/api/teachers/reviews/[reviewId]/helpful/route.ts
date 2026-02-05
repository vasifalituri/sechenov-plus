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

    const body = await request.json();
    const { isHelpful } = body;

    if (typeof isHelpful !== 'boolean') {
      return NextResponse.json(
        { error: 'Укажите isHelpful (true/false)' },
        { status: 400 }
      );
    }

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
      // Если оценка изменилась, обновляем
      if (existing.isHelpful !== isHelpful) {
        await prisma.teacherReviewHelpful.update({
          where: { id: existing.id },
          data: { isHelpful },
        });

        // Обновляем счетчики в отзыве
        const delta = isHelpful ? 2 : -2; // Переключение с helpful на unhelpful или наоборот
        await prisma.teacherReview.update({
          where: { id: reviewId },
          data: {
            helpfulCount: isHelpful ? { increment: 1 } : { decrement: 1 },
            unhelpfulCount: isHelpful ? { decrement: 1 } : { increment: 1 },
          },
        });
      } else {
        // Если оценка та же, удаляем (toggle)
        await prisma.teacherReviewHelpful.delete({
          where: { id: existing.id },
        });

        await prisma.teacherReview.update({
          where: { id: reviewId },
          data: {
            helpfulCount: isHelpful ? { decrement: 1 } : undefined,
            unhelpfulCount: !isHelpful ? { decrement: 1 } : undefined,
          },
        });
      }
    } else {
      // Создаем новую оценку
      await prisma.teacherReviewHelpful.create({
        data: {
          reviewId: reviewId,
          userId: session.user.id,
          isHelpful,
        },
      });

      await prisma.teacherReview.update({
        where: { id: reviewId },
        data: {
          helpfulCount: isHelpful ? { increment: 1 } : undefined,
          unhelpfulCount: !isHelpful ? { increment: 1 } : undefined,
        },
      });
    }

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
