import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/teachers/[id]/reviews - Получить отзывы о преподавателе
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeAll = searchParams.get('includeAll') === 'true'; // Для админов/модераторов

    const session = await getServerSession(authOptions);
    const isAdminOrModerator =
      session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR';

    const where: any = {
      teacherId: id,
    };

    // Обычные пользователи видят только одобренные отзывы
    if (!includeAll || !isAdminOrModerator) {
      where.status = 'APPROVED';
    }

    const reviews = await prisma.teacherReview.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            profileImage: true,
          },
        },
        helpfulness: session?.user
          ? {
              where: {
                userId: session.user.id,
              },
            }
          : undefined,
      },
      orderBy: [
        { helpfulCount: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Не удалось загрузить отзывы' },
      { status: 500 }
    );
  }
}

// POST /api/teachers/[id]/reviews - Добавить отзыв о преподавателе
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const body = await request.json();
    const { content, isAnonymous } = body;

    if (!content || content.trim().length < 10) {
      return NextResponse.json(
        { error: 'Отзыв должен содержать минимум 10 символов' },
        { status: 400 }
      );
    }

    // Проверяем существование преподавателя
    const teacher = await prisma.teacher.findUnique({
      where: { id },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: 'Преподаватель не найден' },
        { status: 404 }
      );
    }

    // Проверяем, не оставлял ли пользователь уже отзыв
    const existingReview = await prisma.teacherReview.findFirst({
      where: {
        teacherId: id,
        userId: session.user.id,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'Вы уже оставили отзыв об этом преподавателе' },
        { status: 400 }
      );
    }

    // Создаем отзыв (по умолчанию PENDING для модерации)
    const review = await prisma.teacherReview.create({
      data: {
        teacherId: id,
        userId: session.user.id,
        content: content.trim(),
        isAnonymous: isAnonymous || false,
        status: 'PENDING',
      },
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

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Не удалось создать отзыв' },
      { status: 500 }