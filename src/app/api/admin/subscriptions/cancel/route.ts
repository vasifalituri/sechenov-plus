import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/admin/subscriptions/cancel - Отменить подписку пользователя
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Проверяем, админ ли это
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      console.error('❌ [Cancel Subscription] Unauthorized - not admin');
      return NextResponse.json({ error: 'Unauthorized - admin access required' }, { status: 401 });
    }

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      console.error('❌ [Cancel Subscription] Missing userId');
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Проверяем, существует ли пользователь
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.error(`❌ [Cancel Subscription] User not found - ${userId}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Проверяем, есть ли у пользователя подписка
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      console.error(`❌ [Cancel Subscription] No subscription found for user ${userId}`);
      return NextResponse.json({ error: 'User has no subscription' }, { status: 404 });
    }

    // Отменяем подписку
    const updatedSubscription = await prisma.subscription.update({
      where: { userId },
      data: {
        status: 'CANCELLED',
      },
    });

    console.log(`✅ [Cancel Subscription] Subscription cancelled for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: updatedSubscription,
    });
  } catch (error) {
    console.error('❌ [Cancel Subscription] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
