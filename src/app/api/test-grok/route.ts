import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Test endpoint works!',
    grokKeyPresent: !!process.env.GROK_API_KEY,
    timestamp: new Date().toISOString()
  });
}
