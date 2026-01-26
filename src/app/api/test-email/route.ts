import { NextResponse } from 'next/server';
import { sendVerificationEmail, testEmailConfiguration } from '@/lib/email';

// Test endpoint - only for development
export async function GET(req: Request) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Not available in production' },
      { status: 403 }
    );
  }

  try {
    // Test email configuration
    const configTest = await testEmailConfiguration();
    
    if (!configTest.success) {
      return NextResponse.json({
        success: false,
        error: 'Gmail SMTP configuration failed',
        details: configTest.message,
        instructions: {
          step1: 'Enable 2FA in Google Account: https://myaccount.google.com/security',
          step2: 'Create App Password: https://myaccount.google.com/apppasswords',
          step3: 'Add to .env.local: GMAIL_USER and GMAIL_APP_PASSWORD',
          step4: 'Restart the server: npm run dev',
        },
      }, { status: 500 });
    }

    // Get test email from query params
    const url = new URL(req.url);
    const testEmail = url.searchParams.get('email');

    if (!testEmail) {
      return NextResponse.json({
        success: true,
        message: 'Gmail SMTP is configured correctly!',
        config: {
          user: process.env.GMAIL_USER,
          passwordSet: !!process.env.GMAIL_APP_PASSWORD,
        },
        usage: 'Add ?email=your@email.com to send a test email',
      });
    }

    // Send test email
    const testCode = '123456';
    const result = await sendVerificationEmail(testEmail, testCode, 'Test User');

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${testEmail}`,
        code: testCode,
        instructions: 'Check your inbox (and spam folder)',
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to send test email',
        details: result.error,
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
