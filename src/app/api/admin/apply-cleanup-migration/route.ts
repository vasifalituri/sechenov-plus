import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * IMPORTANT: This endpoint applies the cleanup migration to remove old quiz attempts.
 * Should only be called ONCE to clean up existing data older than 2 days.
 * 
 * After this, the daily cron job will handle ongoing cleanup.
 * 
 * Protected: Requires ?token=admin_secret in URL
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    
    // Simple protection - in production use proper auth
    if (token !== process.env.ADMIN_SECRET_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🧹 [Cleanup] Starting migration to delete old quiz attempts...');

    // Calculate date 2 days ago
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    console.log('🧹 [Cleanup] Deleting attempts before:', twoDaysAgo.toISOString());

    // First, find all old attempts
    const oldAttempts = await prisma.quizAttempt.findMany({
      where: {
        startedAt: {
          lt: twoDaysAgo
        }
      },
      select: {
        id: true,
        userId: true,
        startedAt: true
      }
    });

    console.log(`🧹 [Cleanup] Found ${oldAttempts.length} old attempts to delete`);

    if (oldAttempts.length === 0) {
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
          in: oldAttempts.map(a => a.id)
        }
      }
    });

    console.log(`🧹 [Cleanup] Deleted ${deletedAnswers.count} quiz answers`);

    // Then delete the attempts
    const deletedAttempts = await prisma.quizAttempt.deleteMany({
      where: {
        startedAt: {
          lt: twoDaysAgo
        }
      }
    });

    console.log(`🧹 [Cleanup] Deleted ${deletedAttempts.count} quiz attempts`);

    return NextResponse.json({
      success: true,
      message: 'Old attempts cleaned up successfully',
      deletedAttempts: deletedAttempts.count,
      deletedAnswers: deletedAnswers.count,
      cutoffDate: twoDaysAgo.toISOString(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [Cleanup] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to cleanup old attempts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
