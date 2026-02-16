import { prisma } from './prisma';
import { PlanType } from '@prisma/client';

export async function getUserSubscription(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    include: { payments: { take: 5, orderBy: { createdAt: 'desc' } } }
  });
  return subscription;
}

export async function checkSubscriptionActive(userId: string) {
  const subscription = await getUserSubscription(userId);
  
  if (!subscription) return false;
  if (subscription.planType === 'FREE') return false;
  if (subscription.status !== 'ACTIVE') return false;
  if (subscription.endDate && new Date() > subscription.endDate) return false;
  
  return true;
}

export async function createSubscription(userId: string, planType: PlanType = 'FREE') {
  return await prisma.subscription.create({
    data: {
      userId,
      planType,
      status: 'ACTIVE'
    }
  });
}

export async function getSubscriptionSettings() {
  let settings = await prisma.subscriptionSettings.findFirst();
  
  if (!settings) {
    settings = await prisma.subscriptionSettings.create({
      data: {
        yearlyPrice: 20,
        currency: 'AZN',
        quickTestLimit: 1,
        dataRetentionDays: 2
      }
    });
  }
  
  return settings;
}

export async function updateSubscriptionSettings(data: any) {
  let settings = await prisma.subscriptionSettings.findFirst();
  
  if (!settings) {
    return await prisma.subscriptionSettings.create({ data });
  }
  
  return await prisma.subscriptionSettings.update({
    where: { id: settings.id },
    data
  });
}

export async function checkQuickTestLimit(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  const settings = await getSubscriptionSettings();
  
  // Premium users have unlimited
  if (subscription?.planType === 'PREMIUM') return true;
  
  // Free users check daily limit
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayAttempts = await prisma.quizAttempt.count({
    where: {
      userId,
      mode: 'RANDOM_30',
      startedAt: { gte: today }
    }
  });
  
  return todayAttempts < settings.quickTestLimit;
}
