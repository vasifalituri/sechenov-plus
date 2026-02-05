import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/teachers/[id]/photo - Загрузить фото преподавателя
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

    if (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Файл не загружен' }, { status: 400 });
    }

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Можно загружать только изображения' },
        { status: 400 }
      );
    }

    // Проверка размера файла (макс 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Файл слишком большой. Максимум 2MB' },
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

    // Генерируем уникальное имя файла
    const fileExt = file.name.split('.').pop();
    const fileName = `${id}-${Date.now()}.${fileExt}`;
    const filePath = `teachers/${fileName}`;

    // Конвертируем File в ArrayBuffer для Supabase
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Загружаем в Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('teachers')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json(
        { error: 'Ошибка загрузки в хранилище' },
        { status: 500 }
      );
    }

    // Получаем публичный URL
    const { data: urlData } = supabase.storage
      .from('teachers')
      .getPublicUrl(filePath);

    const photoUrl = urlData.publicUrl;

    // Удаляем старое фото, если было
    if (teacher.photoUrl) {
      const oldPath = teacher.photoUrl.split('/teachers/')[1];
      if (oldPath) {
        await supabase.storage.from('teachers').remove([`teachers/${oldPath}`]);
      }
    }

    // Обновляем URL фото в базе данных
    const updatedTeacher = await prisma.teacher.update({
      where: { id },
      data: { photoUrl },
    });

    return NextResponse.json({
      photoUrl,
      message: 'Фото успешно загружено',
    });
  } catch (error) {
    console.error('Error uploading teacher photo:', error);
    return NextResponse.json(
      { error: 'Не удалось загрузить фото' },
      { status: 500 }
    );
  }
}
