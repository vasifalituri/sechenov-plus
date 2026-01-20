import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { rateLimit, createRateLimitResponse, getClientIdentifier } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

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

    // Create user with PENDING status
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        username: validatedData.username,
        password: hashedPassword,
        fullName: validatedData.fullName,
        academicYear: validatedData.academicYear,
        status: 'PENDING',
        role: 'USER',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Регистрация успешна! Ожидайте одобрения администратора.',
      data: {
        id: user.id,
        email: user.email,
        status: user.status,
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
