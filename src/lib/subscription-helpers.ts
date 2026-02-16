import { prisma } from './prisma';

// Get subscription settings
export async function getSubscriptionSettings() {
  try {
    let settings = await prisma.subscriptionSettings.findFirst();
    if (!settings) {
      settings = await prisma.subscriptionSettings.create({
        data: {
          monthlyPrice: 2,
          yearlyPrice: 20,
          quickTestLimit: 1,
          dataRetentionDays: 2
        }
      });
    }
    return settings;
  } catch (error) {
    console.error('Error getting subscription settings:', error);
    return null;
  }
}

// Update subscription settings
export async function updateSubscriptionSettings(data: any) {
  try {
    let settings = await prisma.subscriptionSettings.findFirst();
    if (!settings) {
      return await prisma.subscriptionSettings.create({ data });
    }
    return await prisma.subscriptionSettings.update({
      where: { id: settings.id },
      data
    });
  } catch (error) {
    console.error('Error updating subscription settings:', error);
    return null;
  }
}

// Check if user has active subscription (admins always have full access)
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    // Admins bypass subscription checks
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user?.role === 'ADMIN') return true;

    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    });

    if (!subscription) return false;

    // Check if subscription is active and not expired
    if (subscription.status !== 'ACTIVE') return false;
    
    // If endDate is set and is in the past, subscription is expired
    if (subscription.endDate && subscription.endDate < new Date()) return false;

    return true;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}

// Check quick test daily limit (admins bypass this)
export async function checkQuickTestLimit(userId: string): Promise<{ canTake: boolean; message?: string }> {
  try {
    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    // Admins have no limits
    if (user?.role === 'ADMIN') {
      return { canTake: true };
    }

    // Get user's subscription status
    const hasSubscription = await hasActiveSubscription(userId);
    
    // Premium users have no limits
    if (hasSubscription) {
      return { canTake: true };
    }

    // Check if free user already took a test today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAttempt = await prisma.quizAttempt.findFirst({
      where: {
        userId,
        mode: 'RANDOM_30',
        startedAt: {
          gte: today
        }
      }
    });

    if (todayAttempt) {
      return {
        canTake: false,
        message: 'Вы уже прошли один быстрый тест сегодня. Вернитесь завтра или подпишитесь на премиум!'
      };
    }

    return { canTake: true };
  } catch (error) {
    console.error('Error checking quick test limit:', error);
    return { canTake: true };
  }
}
