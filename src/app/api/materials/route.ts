import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { rateLimit, createRateLimitResponse, getClientIdentifier } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { safeJsonParse } from '@/lib/body-validator';

// Next.js App Router route segment config
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout
export const dynamic = 'force-dynamic';

// GET - List materials with filters
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const academicYear = searchParams.get('academicYear');
    const subjectId = searchParams.get('subjectId');
    const search = searchParams.get('search');

    interface MaterialWhereInput {
      status: 'APPROVED' | 'PENDING' | 'REJECTED';
      academicYear?: number;
      subjectId?: string;
      OR?: Array<{
        title?: { contains: string; mode: 'insensitive' };
        description?: { contains: string; mode: 'insensitive' };
      }>;
    }

    const where: MaterialWhereInput = { status: 'APPROVED' as const };

    if (academicYear) {
      where.academicYear = parseInt(academicYear);
    }

    if (subjectId) {
      where.subjectId = subjectId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const materials = await prisma.material.findMany({
      where,
      include: {
        subject: true,
        uploadedBy: {
          select: {
            id: true,
            fullName: true,
            academicYear: true,
            profileImage: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to 100 results for performance
    });

    return NextResponse.json({ success: true, data: materials });
  } catch (error) {
    logger.error('Error fetching materials', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch materials' },
      { status: 500 }
    );
  }
}

// POST - Create material (metadata only, file uploaded to Supabase by client)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting: 10 uploads per hour per user
    const identifier = getClientIdentifier(req, session.user.id);
    const rateLimitResult = await rateLimit(identifier, {
      interval: 60 * 60 * 1000, // 1 hour
      uniqueTokenPerInterval: 500,
      maxRequests: 10,
    });
    
    const rateLimitResponse = createRateLimitResponse(rateLimitResult);
    if (rateLimitResponse) return rateLimitResponse;

    // Parse JSON body (metadata only, no file)
    const parseResult = await safeJsonParse(req, 50); // 50KB max for metadata
    if (!parseResult.success) {
      return parseResult.error;
    }

    const body = parseResult.data;

    // Validate required fields
    const schema = z.object({
      title: z.string().min(1).max(200),
      description: z.string().optional(),
      subjectId: z.string().uuid(),
      academicYear: z.number().int().min(1).max(6),
      tags: z.array(z.string()).optional(),
      // File metadata (already uploaded to Supabase by client)
      fileUrl: z.string().url(),
      fileName: z.string().min(1),
      fileSize: z.number().positive(),
      fileType: z.enum(['PDF', 'DOCX', 'DOC', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']),
      storagePath: z.string().min(1), // Supabase storage path
      storageType: z.enum(['SUPABASE', 'EXTERNAL_MEGA', 'LOCAL']).optional().default('SUPABASE'),
      storageBucket: z.string().optional(),
      externalUrl: z.string().url().optional(),
    });

    const validatedData = schema.parse(body);

    logger.info('Creating material metadata', {
      title: validatedData.title,
      fileSize: validatedData.fileSize,
      userId: session.user.id,
    });

    // Create database record with PENDING status
    const material = await prisma.material.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || '',
        filePath: validatedData.storageType === 'SUPABASE' ? validatedData.storagePath : validatedData.fileUrl,
        fileName: validatedData.fileName,
        fileSize: validatedData.fileSize,
        fileType: validatedData.fileType.includes('pdf') ? 'PDF' : 'DOCX',
        storageType: validatedData.storageType,
        storageBucket: validatedData.storageBucket,
        externalUrl: validatedData.externalUrl,
        subjectId: validatedData.subjectId,
        academicYear: validatedData.academicYear,
        uploadedById: session.user.id,
        tags: validatedData.tags || [],
        status: 'PENDING', // Will be reviewed by admin
      },
      include: {
        subject: true,
        uploadedBy: {
          select: {
            id: true,
            fullName: true,
            academicYear: true,
            profileImage: true,
          },
        },
      },
    });

    logger.info('Material created successfully', {
      materialId: material.id,
      userId: session.user.id,
    });

    // Automatically trigger migration to MEGA in background (non-blocking)
    if (validatedData.storageType === 'SUPABASE') {
      // Trigger migration asynchronously (fire and forget)
      fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/materials/migrate-to-mega`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': req.headers.get('cookie') || '', // Forward session
        },
        body: JSON.stringify({ materialId: material.id }),
      }).catch(err => {
        logger.warn('Background MEGA migration failed (non-critical)', { materialId: material.id, error: err });
      });

      logger.info('Background MEGA migration triggered', { materialId: material.id });
    }

    return NextResponse.json({ 
      success: true, 
      data: material,
      message: 'Материал загружен успешно! Ожидает проверки администратором. Файл будет автоматически перенесён в MEGA.' 
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create material';
    logger.error('Error creating material', error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
