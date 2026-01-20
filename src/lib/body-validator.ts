import { NextResponse } from 'next/server';
import { logger } from './logger';

/**
 * Validates JSON body size to prevent DoS attacks
 * @param request - The incoming request
 * @param maxSizeBytes - Maximum allowed body size in bytes (default 1MB)
 * @returns null if valid, NextResponse with error if invalid
 */
export async function validateJsonBodySize(
  request: Request,
  maxSizeBytes: number = 1024 * 1024 // 1MB default
): Promise<{ error: NextResponse | null; data: any }> {
  try {
    const contentLength = request.headers.get('content-length');
    
    // Check content-length header first (if available)
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (size > maxSizeBytes) {
        logger.warn('Request body too large (from content-length)', {
          size,
          maxSize: maxSizeBytes,
        });
        return {
          error: NextResponse.json(
            { 
              success: false, 
              error: `Request body too large. Maximum size is ${Math.round(maxSizeBytes / 1024)}KB` 
            },
            { status: 413 }
          ),
          data: null,
        };
      }
    }

    // Read and validate actual body
    const text = await request.text();
    const actualSize = new Blob([text]).size;
    
    if (actualSize > maxSizeBytes) {
      logger.warn('Request body too large (actual size)', {
        actualSize,
        maxSize: maxSizeBytes,
      });
      return {
        error: NextResponse.json(
          { 
            success: false, 
            error: `Request body too large. Maximum size is ${Math.round(maxSizeBytes / 1024)}KB` 
          },
          { status: 413 }
        ),
        data: null,
      };
    }

    // Parse JSON
    const data = JSON.parse(text);
    return { error: null, data };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        error: NextResponse.json(
          { success: false, error: 'Invalid JSON format' },
          { status: 400 }
        ),
        data: null,
      };
    }
    
    logger.error('Error validating body', error);
    return {
      error: NextResponse.json(
        { success: false, error: 'Failed to process request body' },
        { status: 500 }
      ),
      data: null,
    };
  }
}

/**
 * Helper to safely parse JSON with size limits
 */
export async function safeJsonParse<T = any>(
  request: Request,
  maxSizeKB: number = 100
): Promise<{ success: true; data: T } | { success: false; error: NextResponse }> {
  const result = await validateJsonBodySize(request, maxSizeKB * 1024);
  
  if (result.error) {
    return { success: false, error: result.error };
  }
  
  return { success: true, data: result.data as T };
}
