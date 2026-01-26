import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { rateLimit, createRateLimitResponse, getClientIdentifier } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { sendVerificationEmail } from '@/lib/email';

const sendCodeSchema = z.object({
  email: z.string().email('Неверный формат email'),
  userId: z.string().uuid('Неверный ID пользователя'),
});

// Generate 6-digit code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    // Rate limiting: 3 attempts per 15 minutes per IP
    const identifier = getClientIdentifier(req);
    const rateLimitResult = await rateLimit(identifier, {
      interval: 15 * 60 * 1000, // 15 minutes
      uniqueTokenPerInterval: 500,
      maxRequests: 3,
    });
    
    const rateLimitResponse = createRateLimitResponse(rateLimitResult);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const validatedData = sendCodeSchema.parse(body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId, email: validatedData.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { success: false, error: 'Email уже подтвержден' },
        { status: 400 }
      );
    }

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete old verification codes for this user
    await prisma.verificationCode.deleteMany({
      where: { userId: user.id },
    });

    // Create new verification code
    await prisma.verificationCode.create({
      data: {
        userId: user.id,
        email: user.email,
        code,
        expiresAt,
      },
    });

    // Send email with verification code
    const emailResult = await sendVerificationEmail(user.email, code, user.fullName);

    if (!emailResult.success) {
      logger.error('Failed to send verification email', { 
        error: emailResult.error,
        email: user.email,
        userId: user.id
      });

      return NextResponse.json(
        { 
          success: false, 
          error: 'Ошибка отправки email. Проверьте настройки Gmail SMTP.',
          debug: process.env.NODE_ENV === 'development' ? emailResult.error : undefined
        },
        { status: 500 }
      );
    }

    logger.info(`Verification code sent to ${user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Код подтверждения отправлен на ваш email',
      expiresIn: 15, // minutes
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    logger.error('Send verification code error', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}
