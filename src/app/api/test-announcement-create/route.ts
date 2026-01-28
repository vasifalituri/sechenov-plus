import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    console.log('🧪 TEST: POST /api/test-announcement-create');
    
    const session = await getServerSession(authOptions);
    console.log('🧪 Session:', session?.user?.email, session?.user?.role);

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      console.log('🧪 Not admin/moderator, returning 403');
      return NextResponse.json({ error: 'Not admin/moderator' }, { status: 403 });
    }

    console.log('🧪 Parsing body...');
    const body = await req.json();
    console.log('🧪 Body:', JSON.stringify(body, null, 2));

    console.log('🧪 Creating announcement...');
    const announcement = await prisma.announcement.create({
      data: {
        title: body.title || 'Test',
        content: body.content || 'Test content',
        type: body.type || 'INFO',
        priority: body.priority || 0,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        authorId: session.user.id,
      },
    });

    console.log('🧪 SUCCESS! Created:', announcement.id);
    return NextResponse.json({ success: true, announcement });
  } catch (error) {
    console.error('🧪 ERROR:', error);
    return NextResponse.json({ 
      error: 'Failed', 
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
