import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkSubscriptionActive, getUserSubscription } from '@/lib/subscription-helpers';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isActive = await checkSubscriptionActive(session.user.id);
    const subscription = await getUserSubscription(session.user.id);
    
    return NextResponse.json({
      isSubscribed: isActive,
      subscription: subscription ? {
        planType: subscription.planType,
        status: subscription.status,
        endDate: subscription.endDate
      } : null
    });
  } catch (error) {
    console.error('Error checking subscription:', error);
    return NextResponse.json({ error: 'Failed to check subscription' }, { status: 500 });
  }
}
