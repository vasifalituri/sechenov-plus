import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/teachers/[id]/rating - Оценить преподавателя
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const body = await request.json();
    const { knowledgeRating, teachingRating, communicationRating, fairnessRating } = body;

    // Валидация рейтингов
    if (
      !knowledgeRating ||
      !teachingRating ||
      !communicationRating ||
      !fairnessRating ||
      [knowledgeRating, teachingRating, communicationRating, fairnessRating].some(
        (r) => r < 1 || r > 5
      )
    ) {
      return NextResponse.json(
        { error: 'Все оценки должны быть от 1 до 5' },
        { status: 400 }
      );
    }

    // Проверяем существование преподавателя
    const teacher = await prisma.teacher.findUnique({
      where: { id: params.id },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: 'Преподаватель не найден' },
        { status: 404 }
      );
    }

    // Вычисляем общий рейтинг
    const overallRating =
      (knowledgeRating + teachingRating + communicationRating + fairnessRating) / 4;

    // Проверяем, не оценивал ли пользователь уже этого преподавателя
    const existingRating = await prisma.teacherRating.findUnique({
      where: {
        teacherId_userId: {
          teacherId: params.id,
          userId: session.user.id,
        },
      },
    });

    let rating;

    if (existingRating) {
      // Обновляем существующую оценку
      rating = await prisma.teacherRating.update({
        where: { id: existingRating.id },
        data: {
          knowledgeRating,
          teachingRating,
          communicationRating,
          fairnessRating,
          overallRating,
        },
      });
    } else {
      // Создаем новую оценку
      rating = await prisma.teacherRating.create({
        data: {
          teacherId: params.id,
          userId: session.user.id,
          knowledgeRating,
          teachingRating,
          communicationRating,
          fairnessRating,
          overallRating,
        },
      });
    }

    // Пересчитываем средний рейтинг преподавателя
    const allRatings = await prisma.teacherRating.findMany({
      where: { teacherId: params.id },
      select: { overallRating: true },
    });

    const averageRating =
      allRatings.reduce((sum, r) => sum + r.overallRating, 0) / allRatings.length;

    // Обновляем статистику преподавателя
    await prisma.teacher.update({
      where: { id: params.id },
      data: {
        averageRating,
        totalRatings: allRatings.length,
      },
    });

    return NextResponse.json(rating, { status: existingRating ? 200 : 201 });
  } catch (error) {
    console.error('Error rating teacher:', error);
    return NextResponse.json(
      { error: 'Не удалось оценить преподавателя' },
      { status: 500 }
    );
  }
}

// GET /api/teachers/[id]/rating - Получить оценку текущего пользователя
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const rating = await prisma.teacherRating.findUnique({
      where: {
        teacherId_userId: {
          teacherId: params.id,
          userId: session.user.id,
        },
      },
    });

    if (!rating) {
      return NextResponse.json({ rating: null });
    }

    return NextResponse.json(rating);
  } catch (error) {
    console.error('Error fetching user rating:', error);
    return NextResponse.json(
      { error: 'Не удалось загрузить оценку' },
      { status: 500 }
    );
  }
}
