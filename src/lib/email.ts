/**
 * Email Service using Resend
 * Handles sending verification codes and other emails
 */

import { Resend } from 'resend';
import { logger } from './logger';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Generate a 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Calculate expiry time for verification code (15 minutes from now)
 */
export function getVerificationCodeExpiry(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 15);
  return expiry;
}

/**
 * Check if verification code is expired
 */
export function isVerificationCodeExpired(expiry: Date | null): boolean {
  if (!expiry) return true;
  return new Date() > expiry;
}

/**
 * Send verification code email
 */
export async function sendVerificationEmail(
  email: string,
  code: string,
  fullName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    logger.info('Sending verification email', { email, code });

    const { data, error } = await resend.emails.send({
      from: 'Sechenov Plus <onboarding@resend.dev>', // You can customize this later with your domain
      to: email,
      subject: 'Подтвердите ваш email - Sechenov Plus',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .code-box { background: white; border: 2px dashed #667eea; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px; }
            .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 Sechenov Plus</h1>
              <p>Подтверждение регистрации</p>
            </div>
            <div class="content">
              <h2>Здравствуйте, ${fullName}!</h2>
              <p>Спасибо за регистрацию на платформе Sechenov Plus.</p>
              <p>Для завершения регистрации, пожалуйста, введите этот код подтверждения:</p>
              
              <div class="code-box">
                <div class="code">${code}</div>
              </div>
              
              <p><strong>Важно:</strong> Код действителен в течение 15 минут.</p>
              <p>Если вы не регистрировались на нашей платформе, просто проигнорируйте это письмо.</p>
              
              <div class="footer">
                <p>С уважением,<br>Команда Sechenov Plus</p>
                <p style="font-size: 12px; color: #9ca3af;">Это автоматическое письмо, пожалуйста, не отвечайте на него.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      logger.error('Error sending verification email', { error });
      return { success: false, error: error.message };
    }

    logger.info('Verification email sent successfully', { email, messageId: data?.id });
    return { success: true };
  } catch (error) {
    logger.error('Exception sending verification email', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send welcome email after successful verification
 */
export async function sendWelcomeEmail(
  email: string,
  fullName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Sechenov Plus <onboarding@resend.dev>',
      to: email,
      subject: 'Добро пожаловать в Sechenov Plus! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Добро пожаловать!</h1>
            </div>
            <div class="content">
              <h2>Привет, ${fullName}!</h2>
              <p>Ваш аккаунт успешно активирован. Теперь вы можете пользоваться всеми функциями платформы:</p>
              <ul>
                <li>📚 Скачивать учебные материалы</li>
                <li>💬 Участвовать в обсуждениях</li>
                <li>📤 Загружать свои материалы</li>
                <li>⭐ Оценивать контент</li>
              </ul>
              <p style="text-align: center;">
                <a href="${process.env.NEXTAUTH_URL}/login" class="button">Войти в аккаунт</a>
              </p>
              <p>Если у вас есть вопросы, не стесняйтесь обращаться к нам!</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      logger.error('Error sending welcome email', { error });
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    logger.error('Exception sending welcome email', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
