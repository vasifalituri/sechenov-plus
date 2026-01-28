import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Get file size limit based on user role
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = session.user.role === 'ADMIN';
    const maxFileSize = isAdmin ? 500 * 1024 * 1024 : 10 * 1024 * 1024; // 500MB for admins, 10MB for users
    const maxFileSizeMB = isAdmin ? 500 : 10;

    return NextResponse.json({
      success: true,
      data: {
        maxFileSize,
        maxFileSizeMB,
        isAdmin,
        message: isAdmin 
          ? 'Вы администратор. Вы можете загружать файлы до 500MB.' 
          : 'Максимальный размер файла: 10MB.',
      },
    });
  } catch (error) {
    console.error('Error getting file size limit:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get file size limit' },
      { status: 500 }
    );
  }
}
