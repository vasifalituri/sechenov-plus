import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { logger } from './logger';

/**
 * Middleware для проверки аутентификации
 */
export async function requireAuth(requiredStatus: 'APPROVED' | 'ANY' = 'APPROVED') {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null };
  }
  
  if (requiredStatus === 'APPROVED' && session.user.status !== 'APPROVED') {
    return { error: NextResponse.json({ error: 'Account not approved' }, { status: 403 }), session: null };
  }
  
  return { error: null, session };
}

/**
 * Middleware для проверки админа (только ADMIN)
 */
export async function requireAdmin() {
  const { error, session } = await requireAuth('ANY');
  
  if (error) return { error, session: null };
  
  if (session?.user.role !== 'ADMIN') {
    return { error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }), session: null };
  }
  
  return { error: null, session };
}

/**
 * Middleware для проверки модератора (ADMIN или MODERATOR)
 */
export async function requireModerator() {
  const { error, session } = await requireAuth('ANY');
  
  if (error) return { error, session: null };
  
  if (session?.user.role !== 'ADMIN' && session?.user.role !== 'MODERATOR') {
    return { error: NextResponse.json({ error: 'Moderator access required' }, { status: 403 }), session: null };
  }
  
  return { error: null, session };
}

/**
 * Обработчик ошибок для API
 */
export function handleApiError(error: unknown, context: string = 'API') {
  logger.error(`${context} Error`, error);
  
  if (error instanceof Error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
  
  return NextResponse.json(
    { success: false, error: 'Internal server error' },
    { status: 500 }
  );
}

/**
 * Success response helper
 */
export function successResponse<T>(data: T, message?: string) {
  return NextResponse.json({
    success: true,
    data,
    ...(message && { message }),
  });
}

/**
 * Error response helper
 */
export function errorResponse(error: string, status: number = 400) {
  return NextResponse.json(
    { success: false, error },
    { status }
  );
}
