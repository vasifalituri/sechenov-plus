import { NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const store: RateLimitStore = {};

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    Object.keys(store).forEach(key => {
      if (store[key].resetTime < now) delete store[key];
    });
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  interval: number; // milliseconds
  uniqueTokenPerInterval: number; // max number of unique tokens
  maxRequests: number; // max requests per interval
}

export async function rateLimit(
  identifier: string,
  options: RateLimitOptions = {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500,
    maxRequests: 10,
  }
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const now = Date.now();
  const key = identifier;

  if (!store[key] || store[key].resetTime < now) {
    store[key] = {
      count: 0,
      resetTime: now + options.interval,
    };
  }

  store[key].count++;

  const remaining = Math.max(0, options.maxRequests - store[key].count);
  const success = store[key].count <= options.maxRequests;

  return {
    success,
    limit: options.maxRequests,
    remaining,
    reset: store[key].resetTime,
  };
}

export function createRateLimitResponse(result: {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}) {
  if (!result.success) {
    return NextResponse.json(
      { 
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.reset.toString(),
          'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }
  return null;
}

// Helper to get client identifier (IP or user ID)
export function getClientIdentifier(request: Request, userId?: string): string {
  if (userId) return `user_${userId}`;
  
  // Try to get IP from headers
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  return `ip_${ip}`;
}
