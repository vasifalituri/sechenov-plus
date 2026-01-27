import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  // Check if Gmail credentials are configured
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  // Temporary debug logging
  console.log('🔍 DEBUG: GMAIL_USER =', gmailUser);
  console.log('🔍 DEBUG: GMAIL_APP_PASSWORD length =', gmailAppPassword?.length);
  console.log('🔍 DEBUG: GMAIL_APP_PASSWORD first 4 chars =', gmailAppPassword?.substring(0, 4));

  if (!gmailUser || !gmailAppPassword) {
    console.warn('⚠️ Gmail SMTP not configured. Email sending will fail.');
    console.warn('Please set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });
};

// Email template for verification code
const getVerificationEmailTemplate = (code: string, userName?: string) => {
  return {
    subject: 'Код подтверждения Sechenov+',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9fafb;
              border-radius: 8px;
              padding: 30px;
              border: 1px solid #e5e7eb;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 10px;
            }
            .code-container {
              background-color: white;
              border: 2px dashed #2563eb;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 30px 0;
            }
            .code {
              font-size: 36px;
              font-weight: bold;
              color: #2563eb;
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
            }
            .message {
              color: #6b7280;
              margin: 20px 0;
            }
            .warning {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 12px;
              margin: 20px 0;
              border-radius: 4px;
              font-size: 14px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #9ca3af;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎓 Sechenov+</div>
              <p style="color: #6b7280; margin: 0;">Платформа для медицинских студентов</p>
            </div>
            
            ${userName ? `<p>Здравствуйте, ${userName}!</p>` : '<p>Здравствуйте!</p>'}
            
            <p class="message">
              Спасибо за регистрацию на платформе Sechenov+. 
              Для завершения регистрации введите код подтверждения:
            </p>
            
            <div class="code-container">
              <div style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
                Ваш код подтверждения:
              </div>
              <div class="code">${code}</div>
            </div>
            
            <div class="warning">
              ⚠️ <strong>Важно:</strong> Код действителен в течение 15 минут. 
              Не сообщайте его никому!
            </div>
            
            <p class="message">
              Если вы не регистрировались на платформе Sechenov+, 
              просто проигнорируйте это письмо.
            </p>
            
            <div class="footer">
              <p>С уважением,<br>Команда Sechenov+</p>
              <p style="margin-top: 10px;">
                Это автоматическое письмо, пожалуйста, не отвечайте на него.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Sechenov+ - Код подтверждения

${userName ? `Здравствуйте, ${userName}!` : 'Здравствуйте!'}

Спасибо за регистрацию на платформе Sechenov+.

Ваш код подтверждения: ${code}

Код действителен в течение 15 минут.

Если вы не регистрировались на платформе Sechenov+, просто проигнорируйте это письмо.

С уважением,
Команда Sechenov+
    `.trim(),
  };
};

// Send verification code email
export async function sendVerificationEmail(
  to: string,
  code: string,
  userName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter();
    const template = getVerificationEmailTemplate(code, userName);

    const info = await transporter.sendMail({
      from: {
        name: 'Sechenov+',
        address: process.env.GMAIL_USER || 'noreply@example.com',
      },
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    console.log('✅ Email sent successfully:', info.messageId);
    console.log('📧 To:', to);
    console.log('🔑 Code:', code);

    return { success: true };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Test email configuration
export async function testEmailConfiguration(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return {
      success: true,
      message: 'Gmail SMTP configuration is valid',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
