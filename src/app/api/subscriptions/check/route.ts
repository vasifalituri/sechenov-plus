import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/subscriptions/check - Проверить статус подписки пользователя
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        isActive: false,
        planType: 'FREE'
      }, { status: 401 });
    }

    // Получаем подписку пользователя
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      include: {
        payments: {
          where: { status: 'COMPLETED' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    // Проверяем активна ли подписка
    const now = new Date();
    const isActive = 
      subscription &&
      subscription.status === 'ACTIVE' &&
      subscription.endDate > now;

    const planType = subscription?.planType || 'FREE';

    return NextResponse.json({
      isActive,
      planType,
      subscription: isActive ? {
        id: subscription.id,
        planType: subscription.planType,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        autoRenew: subscription.autoRenew,
        daysRemaining: isActive ? 
          Math.ceil((subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) 
          : 0,
        lastPayment: subscription.payments[0] ? {
          id: subscription.payments[0].id,
          amount: subscription.payments[0].amount,
          currency: subscription.payments[0].currency,
          date: subscription.payments[0].createdAt
        } : null
      } : null
    });
  } catch (error) {
    console.error('❌ [Subscription Check]', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      isActive: false,
      planType: 'FREE'
    }, { status: 500 });
  }
}
