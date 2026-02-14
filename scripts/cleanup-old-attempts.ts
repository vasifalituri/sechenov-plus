import { prisma } from '@/lib/prisma';

/**
 * Скрипт для очистки старых попыток тестов (старше 2 дней)
 * Запуск: npx ts-node scripts/cleanup-old-attempts.ts
 */
async function cleanupOldAttempts() {
  try {
    console.log('🗑️ Starting cleanup of old quiz attempts...');

    // Вычисляем дату 2 дня назад
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    console.log(`📅 Deleting attempts created before: ${twoDaysAgo.toISOString()}`);

    // Находим старые попытки
    const oldAttempts = await prisma.quizAttempt.findMany({
      where: {
        startedAt: {
          lt: twoDaysAgo
        }
      },
      select: {
        id: true,
        userId: true,
        startedAt: true,
        score: true
      }
    });

    console.log(`📊 Found ${oldAttempts.length} old attempts`);

    if (oldAttempts.length > 0) {
      console.log('\n📋 Attempts to delete:');
      oldAttempts.slice(0, 5).forEach(attempt => {
        console.log(`  - ID: ${attempt.id}, User: ${attempt.userId}, Date: ${attempt.startedAt.toISOString()}, Score: ${attempt.score}`);
      });
      if (oldAttempts.length > 5) {
        console.log(`  ... and ${oldAttempts.length - 5} more`);
      }
    }

    // Удаляем ответы
    const deletedAnswers = await prisma.quizAnswer.deleteMany({
      where: {
        attemptId: {
          in: oldAttempts.map(a => a.id)
        }
      }
    });

    console.log(`\n✅ Deleted ${deletedAnswers.count} quiz answers`);

    // Удаляем попытки
    const deletedAttempts = await prisma.quizAttempt.deleteMany({
      where: {
        startedAt: {
          lt: twoDaysAgo
        }
      }
    });

    console.log(`✅ Deleted ${deletedAttempts.count} quiz attempts`);

    console.log(`\n🎉 Cleanup completed successfully!`);
    console.log(`📊 Summary: Deleted ${deletedAttempts.count} attempts and ${deletedAnswers.count} answers`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOldAttempts();
