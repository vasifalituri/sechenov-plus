import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { z } from 'zod';
import { rateLimit, createRateLimitResponse, getClientIdentifier } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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
    try {
      if (!resend) {
        logger.error('Resend API key not configured');
        return NextResponse.json(
          { success: false, error: 'Email сервис временно недоступен. Обратитесь к администратору.' },
          { status: 503 }
        );
      }

      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Sechenov+ <onboarding@resend.dev>',
        to: user.email,
        subject: 'Код подтверждения email - Sechenov+',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .code-box { background: white; border: 2px dashed #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
                .code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #667eea; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
                .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎓 Sechenov+</h1>
                  <p>Подтверждение email адреса</p>
                </div>
                <div class="content">
                  <p>Здравствуйте, <strong>${user.fullName}</strong>!</p>
                  <p>Спасибо за регистрацию на платформе Sechenov+. Для завершения регистрации введите код подтверждения:</p>
                  
                  <div class="code-box">
                    <div class="code">${code}</div>
                    <p style="margin: 10px 0 0 0; color: #666;">Код действителен 15 минут</p>
                  </div>

                  <div class="warning">
                    <strong>⚠️ Важно:</strong> Если вы не регистрировались на Sechenov+, проигнорируйте это письмо.
                  </div>

                  <p>С уважением,<br>Команда Sechenov+</p>
                </div>
                <div class="footer">
                  <p>Это автоматическое письмо, не отвечайте на него.</p>
                  <p>© 2025 Sechenov+ | Платформа для медицинских студентов</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      logger.info(`Verification code sent to ${user.email}`);

      return NextResponse.json({
        success: true,
        message: 'Код подтверждения отправлен на ваш email',
        expiresIn: 15, // minutes
      });
    } catch (emailError) {
      logger.error('Failed to send verification email', emailError);
      return NextResponse.json(
        { success: false, error: 'Ошибка отправки email. Попробуйте позже.' },
        { status: 500 }
      );
    }
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
