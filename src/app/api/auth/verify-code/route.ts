import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isVerificationCodeExpired, sendWelcomeEmail } from '@/lib/email';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/verify-code
 * Verify the code and activate user account
 */
export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email и код обязательны' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        emailVerified: true,
        verificationCode: true,
        verificationCodeExpiry: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email уже подтверждён' }, { status: 400 });
    }

    if (!user.verificationCode) {
      return NextResponse.json(
        { error: 'Код подтверждения не найден. Запросите новый код.' },
        { status: 400 }
      );
    }

    // Check if code is expired
    if (isVerificationCodeExpired(user.verificationCodeExpiry)) {
      return NextResponse.json(
        { error: 'Код истёк. Запросите новый код.' },
        { status: 400 }
      );
    }

    // Verify code
    if (user.verificationCode !== code) {
      return NextResponse.json(
        { error: 'Неверный код подтверждения' },
        { status: 400 }
      );
    }

    // Update user - verify email and clear code
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationCodeExpiry: null,
        status: 'APPROVED', // Auto-approve after email verification
      },
    });

    // Send welcome email (optional, non-blocking)
    sendWelcomeEmail(user.email, user.fullName).catch((error) => {
      logger.error('Failed to send welcome email', { error });
    });

    logger.info('Email verified successfully', { email: user.email });

    return NextResponse.json({
      success: true,
      message: 'Email успешно подтверждён! Теперь вы можете войти.',
    });
  } catch (error) {
    logger.error('Error verifying code', { error });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
