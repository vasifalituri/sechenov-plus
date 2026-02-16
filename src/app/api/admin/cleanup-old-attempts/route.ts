import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Cron job endpoint - runs daily at 2 AM UTC
 * Deletes quiz attempts older than 2 days
 * 
 * Protected: Requires Authorization header from Vercel
 */
export async function GET(request: NextRequest) {
  try {
    // Verify it's coming from Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🧹 [Cron] Running daily cleanup of old quiz attempts...');

    // Calculate date 2 days ago
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    console.log('🧹 [Cron] Deleting attempts before:', twoDaysAgo.toISOString());

    // Get IDs of old attempts
    const oldAttemptIds = await prisma.quizAttempt.findMany({
      where: {
        startedAt: {
          lt: twoDaysAgo
        }
      },
      select: {
        id: true
      }
    });

    console.log(`🧹 [Cron] Found ${oldAttemptIds.length} old attempts to delete`);

    if (oldAttemptIds.length === 0) {
      return NextResponse.json({
        message: 'No old attempts to delete',
        deletedCount: 0,
        timestamp: new Date().toISOString()
      });
    }

    // Delete quiz answers first (foreign key constraint)
    const deletedAnswers = await prisma.quizAnswer.deleteMany({
      where: {
        attemptId: {
          in: oldAttemptIds.map(a => a.id)
        }
      }
    });

    console.log(`🧹 [Cron] Deleted ${deletedAnswers.count} quiz answers`);

    // Then delete the attempts
    const deletedAttempts = await prisma.quizAttempt.deleteMany({
      where: {
        startedAt: {
          lt: twoDaysAgo
        }
      }
    });

    console.log(`🧹 [Cron] Deleted ${deletedAttempts.count} quiz attempts`);

    return NextResponse.json({
      success: true,
      message: 'Daily cleanup completed',
      deletedAttempts: deletedAttempts.count,
      deletedAnswers: deletedAnswers.count,
      cutoffDate: twoDaysAgo.toISOString(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [Cron] Error:', error);
    return NextResponse.json(
      { 
        error: 'Cleanup failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
