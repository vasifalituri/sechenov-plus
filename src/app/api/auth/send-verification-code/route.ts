import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  sendVerificationEmail, 
  generateVerificationCode, 
  getVerificationCodeExpiry 
} from '@/lib/email';
import { logger } from '@/lib/logger';
import { rateLimit, createRateLimitResponse, getClientIdentifier } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/send-verification-code
 * Send verification code to user's email
 */
export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Rate limiting: 3 requests per 15 minutes per IP
    const identifier = getClientIdentifier(req, email);
    const rateLimitResult = await rateLimit(identifier, {
      interval: 15 * 60 * 1000, // 15 minutes
      uniqueTokenPerInterval: 500,
      maxRequests: 3,
    });

    const rateLimitResponse = createRateLimitResponse(rateLimitResult);
    if (rateLimitResponse) return rateLimitResponse;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, fullName: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email уже подтверждён' }, { status: 400 });
    }

    // Generate verification code
    const code = generateVerificationCode();
    const expiry = getVerificationCodeExpiry();

    // Save code to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode: code,
        verificationCodeExpiry: expiry,
      },
    });

    // Send email
    const emailResult = await sendVerificationEmail(user.email, code, user.fullName);

    if (!emailResult.success) {
      logger.error('Failed to send verification email', { 
        email: user.email, 
        error: emailResult.error 
      });
      return NextResponse.json(
        { error: 'Не удалось отправить код. Попробуйте позже.' },
        { status: 500 }
      );
    }

    logger.info('Verification code sent', { email: user.email });

    return NextResponse.json({
      success: true,
      message: 'Код подтверждения отправлен на ваш email',
    });
  } catch (error) {
    logger.error('Error sending verification code', { error });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
