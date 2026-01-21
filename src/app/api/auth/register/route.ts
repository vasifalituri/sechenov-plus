import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { z } from 'zod';
import { rateLimit, createRateLimitResponse, getClientIdentifier } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Generate 6-digit code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const registerSchema = z.object({
  email: z.string().email('Неверный формат email'),
  username: z.string().min(3, 'Никнейм должен содержать минимум 3 символа').regex(/^[a-zA-Z0-9_-]+$/, 'Только буквы, цифры, дефис и подчеркивание'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
  fullName: z.string().min(2, 'Введите полное имя'),
  academicYear: z.number().min(1).max(6),
});

export async function POST(req: Request) {
  try {
    // Rate limiting: 5 registration attempts per hour per IP
    const identifier = getClientIdentifier(req);
    const rateLimitResult = await rateLimit(identifier, {
      interval: 60 * 60 * 1000, // 1 hour
      uniqueTokenPerInterval: 500,
      maxRequests: 5,
    });
    
    const rateLimitResponse = createRateLimitResponse(rateLimitResult);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    
    // Validate input
    const validatedData = registerSchema.parse(body);
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { username: validatedData.username },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === validatedData.email) {
        return NextResponse.json(
          { success: false, error: 'Пользователь с таким email уже существует' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Никнейм уже занят' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create user with PENDING status and emailVerified = false
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        username: validatedData.username,
        password: hashedPassword,
        fullName: validatedData.fullName,
        academicYear: validatedData.academicYear,
        status: 'PENDING',
        role: 'USER',
        emailVerified: false,
      },
    });

    // Generate and send verification code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Create verification code
    await prisma.verificationCode.create({
      data: {
        userId: user.id,
        email: user.email,
        code,
        expiresAt,
      },
    });

    // Send verification email
    try {
      if (!resend) {
        logger.warn('Resend API key not configured, skipping verification email');
        return NextResponse.json({
          success: true,
          message: 'Регистрация успешна! Email сервис временно недоступен.',
          data: {
            id: user.id,
            email: user.email,
            status: user.status,
            emailVerified: false,
          },
        });
      }

      await resend.emails.send({
        from: 'Sechenov+ <noreply@sechenov-plus.com>',
        to: user.email,
        subject: 'Подтвердите email - Sechenov+',
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
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎓 Sechenov+</h1>
                  <p>Добро пожаловать!</p>
                </div>
                <div class="content">
                  <p>Здравствуйте, <strong>${user.fullName}</strong>!</p>
                  <p>Спасибо за регистрацию на платформе Sechenov+. Введите код подтверждения для завершения регистрации:</p>
                  
                  <div class="code-box">
                    <div class="code">${code}</div>
                    <p style="margin: 10px 0 0 0; color: #666;">Код действителен 15 минут</p>
                  </div>

                  <p>После подтверждения email, администратор рассмотрит вашу заявку.</p>
                  <p>С уважением,<br>Команда Sechenov+</p>
                </div>
                <div class="footer">
                  <p>© 2025 Sechenov+ | Платформа для медицинских студентов</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      logger.info(`Verification code sent to ${user.email}`);
    } catch (emailError) {
      logger.error('Failed to send verification email', emailError);
      // Don't fail registration if email fails - user can request new code
    }

    return NextResponse.json({
      success: true,
      message: 'Регистрация успешна! Проверьте email для подтверждения.',
      data: {
        id: user.id,
        email: user.email,
        status: user.status,
        emailVerified: false,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    logger.error('Registration error', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка регистрации' },
      { status: 500 }
    );
  }
}
