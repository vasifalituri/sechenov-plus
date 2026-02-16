import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Get subscription settings (admin only)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    const settings = await prisma.subscriptionSettings.findFirst();

    if (!settings) {
      return NextResponse.json(
        { error: 'Настройки подписки не найдены' },
        { status: 404 }
      );
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching subscription settings:', error);
    return NextResponse.json(
      { error: 'Ошибка получения настроек подписки' },
      { status: 500 }
    );
  }
}

// Update subscription settings (admin only)
const updateSchema = z.object({
  monthlyPrice: z.number().nullable().optional(),
  yearlyPrice: z.number().optional(),
  quickTestLimit: z.number().int().min(0).optional(),
  dataRetentionDays: z.number().int().min(1).optional(),
  currency: z.string().min(1).optional(),
  freeTrialDays: z.number().int().min(0).optional(),
  aiAnalysisEnabled: z.boolean().optional(),
  thematicBlocksForPaidOnly: z.boolean().optional(),
});

export async function PUT(req: Request) {
  try {
    console.log('🔧 PUT /api/admin/subscription-settings - Start');
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      console.log('❌ Access denied - not admin');
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    console.log('👤 Admin user:', session.user.id);
    const body = await req.json();
    console.log('📦 Request body:', body);

    const validatedData = updateSchema.parse(body);
    console.log('✅ Validation passed:', validatedData);

    // Get or create settings
    let settings = await prisma.subscriptionSettings.findFirst();

    if (!settings) {
      // Create default settings
      settings = await prisma.subscriptionSettings.create({
        data: {
          monthlyPrice: validatedData.monthlyPrice ?? 9.99,
          yearlyPrice: validatedData.yearlyPrice ?? 99.99,
          quickTestLimit: validatedData.quickTestLimit ?? 1,
          dataRetentionDays: validatedData.dataRetentionDays ?? 2,
          currency: validatedData.currency ?? 'AZN',
          freeTrialDays: validatedData.freeTrialDays ?? 0,
          aiAnalysisEnabled: validatedData.aiAnalysisEnabled ?? true,
          thematicBlocksForPaidOnly: validatedData.thematicBlocksForPaidOnly ?? false,
        },
      });
    } else {
      // Update existing settings
      settings = await prisma.subscriptionSettings.update({
        where: { id: settings.id },
        data: {
          ...(validatedData.monthlyPrice !== undefined && { monthlyPrice: validatedData.monthlyPrice }),
          ...(validatedData.yearlyPrice !== undefined && { yearlyPrice: validatedData.yearlyPrice }),
          ...(validatedData.quickTestLimit !== undefined && { quickTestLimit: validatedData.quickTestLimit }),
          ...(validatedData.dataRetentionDays !== undefined && { dataRetentionDays: validatedData.dataRetentionDays }),
          ...(validatedData.currency !== undefined && { currency: validatedData.currency }),
          ...(validatedData.freeTrialDays !== undefined && { freeTrialDays: validatedData.freeTrialDays }),
          ...(validatedData.aiAnalysisEnabled !== undefined && { aiAnalysisEnabled: validatedData.aiAnalysisEnabled }),
          ...(validatedData.thematicBlocksForPaidOnly !== undefined && { thematicBlocksForPaidOnly: validatedData.thematicBlocksForPaidOnly }),
        },
      });
    }

    console.log('✅ Settings updated:', settings.id);
    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Validation error:', error.errors);
      return NextResponse.json(
        { error: 'Неверные данные', details: error.errors },
        { status: 400 }
      );
    }

    console.error('❌ Error updating subscription settings:', error);
    return NextResponse.json(
      { error: 'Ошибка обновления настроек подписки', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
