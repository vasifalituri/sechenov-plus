/**
 * Simple Logger utility to replace console.log
 * Logs only in development, structured logging in production
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  info(message: string, context?: LogContext): void {
    const output = this.isDevelopment ? `ℹ️ ${message}` : this.formatMessage('info', message, context);
    console.log(output, this.isDevelopment && context ? context : '');
  }

  warn(message: string, context?: LogContext): void {
    const output = this.isDevelopment ? `⚠️ ${message}` : this.formatMessage('warn', message, context);
    console.warn(output, this.isDevelopment && context ? context : '');
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
    };
    const output = this.isDevelopment ? `❌ ${message}` : this.formatMessage('error', message, errorContext);
    console.error(output, this.isDevelopment ? errorContext : '');
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) console.debug(`🐛 ${message}`, context || '');
  }

}

export const logger = new Logger();
