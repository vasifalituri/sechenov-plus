import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSubscriptionSettings, updateSubscriptionSettings } from '@/lib/subscription-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const settings = await getSubscriptionSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error getting subscription settings:', error);
    return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const settings = await updateSubscriptionSettings(body);
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating subscription settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
