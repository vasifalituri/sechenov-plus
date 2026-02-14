import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Проверяем что это админ
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      console.error('❌ [Cleanup] Unauthorized - not admin');
      return NextResponse.json(
        { error: 'Unauthorized - admin access required' },
        { status: 401 }
      );
    }

    console.log('🗑️ [Cleanup] Starting cleanup of old quiz attempts...');

    // Вычисляем дату 2 дня назад
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    console.log('🗑️ [Cleanup] Deleting attempts older than:', twoDaysAgo.toISOString());

    // Сначала находим все старые попытки
    const oldAttempts = await prisma.quizAttempt.findMany({
      where: {
        startedAt: {
          lt: twoDaysAgo
        }
      },
      select: {
        id: true,
        userId: true
      }
    });

    console.log(`🗑️ [Cleanup] Found ${oldAttempts.length} old attempts to delete`);

    if (oldAttempts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No old attempts to delete',
        deletedCount: 0,
        deletedAnswersCount: 0
      });
    }

    // Удаляем ответы на вопросы этих попыток
    const deletedAnswers = await prisma.quizAnswer.deleteMany({
      where: {
        attemptId: {
          in: oldAttempts.map(a => a.id)
        }
      }
    });

    console.log(`🗑️ [Cleanup] Deleted ${deletedAnswers.count} quiz answers`);

    // Удаляем саму попытку
    const deletedAttempts = await prisma.quizAttempt.deleteMany({
      where: {
        startedAt: {
          lt: twoDaysAgo
        }
      }
    });

    console.log(`🗑️ [Cleanup] Deleted ${deletedAttempts.count} quiz attempts`);

    return NextResponse.json({
      success: true,
      message: 'Old quiz attempts cleaned up successfully',
      deletedCount: deletedAttempts.count,
      deletedAnswersCount: deletedAnswers.count,
      beforeDate: twoDaysAgo.toISOString()
    });

  } catch (error) {
    console.error('❌ [Cleanup] Error during cleanup:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup old attempts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Для Vercel Cron Jobs - автоматический запуск
export const runtime = 'nodejs';
