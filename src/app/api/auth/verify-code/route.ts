import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { rateLimit, createRateLimitResponse, getClientIdentifier } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const verifyCodeSchema = z.object({
  email: z.string().email('Неверный формат email'),
  code: z.string().length(6, 'Код должен содержать 6 цифр'),
});

export async function POST(req: Request) {
  try {
    // Rate limiting: 10 attempts per 15 minutes per IP
    const identifier = getClientIdentifier(req);
    const rateLimitResult = await rateLimit(identifier, {
      interval: 15 * 60 * 1000, // 15 minutes
      uniqueTokenPerInterval: 500,
      maxRequests: 10,
    });
    
    const rateLimitResponse = createRateLimitResponse(rateLimitResult);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const validatedData = verifyCodeSchema.parse(body);

    // Find verification code
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        email: validatedData.email,
        code: validatedData.code,
        verified: false,
      },
      include: {
        user: true,
      },
    });

    if (!verificationCode) {
      return NextResponse.json(
        { success: false, error: 'Неверный код подтверждения' },
        { status: 400 }
      );
    }

    // Check if code is expired
    if (verificationCode.expiresAt < new Date()) {
      await prisma.verificationCode.delete({
        where: { id: verificationCode.id },
      });
      return NextResponse.json(
        { success: false, error: 'Код истек. Запросите новый код.' },
        { status: 400 }
      );
    }

    // Mark code as verified
    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { verified: true },
    });

    // Update user email verification status
    await prisma.user.update({
      where: { id: verificationCode.userId },
      data: { emailVerified: true },
    });

    logger.info(`Email verified for user ${verificationCode.user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Email успешно подтвержден!',
      user: {
        id: verificationCode.user.id,
        email: verificationCode.user.email,
        emailVerified: true,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    logger.error('Verify code error', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}
