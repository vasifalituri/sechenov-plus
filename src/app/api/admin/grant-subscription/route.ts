import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      console.error('❌ [Grant Subscription] Unauthorized - not admin');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, months } = body;

    if (!userId || !months) {
      console.error('❌ [Grant Subscription] Missing required fields');
      return NextResponse.json(
        { error: 'userId and months are required' },
        { status: 400 }
      );
    }

    if (months < 1 || months > 60) {
      console.error('❌ [Grant Subscription] Invalid months range');
      return NextResponse.json(
        { error: 'Months must be between 1 and 60' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      console.error(`❌ [Grant Subscription] User ${userId} not found`);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log(`📝 [Grant Subscription] Processing subscription for user ${userId}, months: ${months}`);

    // Calculate dates
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + months);

    // Check if subscription exists
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId }
    });

    let subscription;

    if (existingSubscription) {
      // If subscription exists and is active, extend it
      console.log(`🔄 [Grant Subscription] Extending existing subscription for user ${userId}`);
      
      const newEndDate = new Date(existingSubscription.endDate);
      newEndDate.setMonth(newEndDate.getMonth() + months);

      subscription = await prisma.subscription.update({
        where: { userId },
        data: {
          status: 'ACTIVE',
          endDate: newEndDate,
          autoRenew: false,
          updatedAt: now
        }
      });
    } else {
      // Create new subscription
      console.log(`✨ [Grant Subscription] Creating new subscription for user ${userId}`);
      
      subscription = await prisma.subscription.create({
        data: {
          userId,
          planType: 'PREMIUM',
          status: 'ACTIVE',
          startDate: now,
          endDate,
          autoRenew: false
        }
      });
    }

    console.log(`✅ [Grant Subscription] Subscription granted successfully`);
    console.log(`   User: ${userId}, Status: ${subscription.status}, End Date: ${subscription.endDate}`);

    return NextResponse.json({
      success: true,
      message: `Subscription granted for ${months} months`,
      subscription: {
        id: subscription.id,
        userId: subscription.userId,
        planType: subscription.planType,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate
      }
    });
  } catch (error) {
    console.error('❌ [Grant Subscription] Error:', error);
    return NextResponse.json(
      { error: 'Failed to grant subscription' },
      { status: 500 }
    );
  }
}
