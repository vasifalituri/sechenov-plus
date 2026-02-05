import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/teachers/[id] - Получить информацию о преподавателе
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        subjects: {
          include: {
            subject: true,
          },
        },
        ratings: {
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
          orderBy: {
            createdAt: 'desc',
          },
        },
        reviews: {
          where: {
            status: 'APPROVED',
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
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            ratings: true,
            reviews: true,
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: 'Преподаватель не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json(teacher);
  } catch (error) {
    console.error('Error fetching teacher:', error);
    return NextResponse.json(
      { error: 'Не удалось загрузить информацию о преподавателе' },
      { status: 500 }
    );
  }
}

// PATCH /api/teachers/[id] - Обновить информацию о преподавателе (только для админов/модераторов)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
    }

    const body = await request.json();
    const { fullName, department, position, bio, academicDegree, photoUrl, isActive, subjectIds } = body;

    // Обновляем данные преподавателя
    const updateData: any = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (department !== undefined) updateData.department = department;
    if (position !== undefined) updateData.position = position;
    if (bio !== undefined) updateData.bio = bio;
    if (academicDegree !== undefined) updateData.academicDegree = academicDegree;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Если обновляются предметы, сначала удаляем старые связи
    if (subjectIds !== undefined) {
      await prisma.teacherSubject.deleteMany({
        where: { teacherId: id },
      });
    }

    const teacher = await prisma.teacher.update({
      where: { id },
      data: {
        ...updateData,
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

    return NextResponse.json(teacher);
  } catch (error) {
    console.error('Error updating teacher:', error);
    return NextResponse.json(
      { error: 'Не удалось обновить информацию о преподавателе' },
      { status: 500 }
    );
  }
}

// DELETE /api/teachers/[id] - Удалить преподавателя (только для админов)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
    }

    await prisma.teacher.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Преподаватель удален' });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    return NextResponse.json(
      { error: 'Не удалось удалить преподавателя' },
      { status: 500 }
    );
  }
}
