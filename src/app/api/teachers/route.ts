import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/teachers - Получить список всех преподавателей
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const subjectId = searchParams.get('subjectId');
    const sortBy = searchParams.get('sortBy') || 'averageRating'; // averageRating, totalRatings, fullName

    const where: any = {
      isActive: true,
    };

    if (department) {
      where.department = department;
    }

    if (subjectId) {
      where.subjects = {
        some: {
          subjectId: subjectId,
        },
      };
    }

    const teachers = await prisma.teacher.findMany({
      where,
      include: {
        subjects: {
          include: {
            subject: true,
          },
        },
        _count: {
          select: {
            ratings: true,
            reviews: true,
          },
        },
      },
      orderBy:
        sortBy === 'fullName'
          ? { fullName: 'asc' }
          : sortBy === 'totalRatings'
          ? { totalRatings: 'desc' }
          : { averageRating: 'desc' },
    });

    return NextResponse.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json(
      { error: 'Не удалось загрузить список преподавателей' },
      { status: 500 }
    );
  }
}

// POST /api/teachers - Создать нового преподавателя (только для админов/модераторов)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Проверка прав доступа
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
    }

    const body = await request.json();
    const { fullName, department, position, bio, academicDegree, subjectIds } = body;

    if (!fullName || !department) {
      return NextResponse.json(
        { error: 'Укажите имя и кафедру преподавателя' },
        { status: 400 }
      );
    }

    // Создаем преподавателя
    const teacher = await prisma.teacher.create({
      data: {
        fullName,
        department,
        position,
        bio,
        academicDegree,
        subjects: subjectIds
          ? {
              create: subjectIds.map((subjectId: string) => ({
                subjectId,
              })),
            }
          : undefined,
      },
      include: {
        subjects: {
          include: {
            subject: true,
          },
        },
      },
    });

    return NextResponse.json(teacher, { status: 201 });
  } catch (error) {
    console.error('Error creating teacher:', error);
    return NextResponse.json(
      { error: 'Не удалось создать профиль преподавателя' },
      { status: 500 }
    );
  }
}
