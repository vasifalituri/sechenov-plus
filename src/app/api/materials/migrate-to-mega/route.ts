import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadToMega, isMegaConfigured } from '@/lib/external-storage';
import { supabase as supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// This endpoint migrates files from Supabase to MEGA
// Can be called manually or automatically after upload

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Allow admins or system to call this endpoint
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if MEGA is configured
    if (!isMegaConfigured()) {
      return NextResponse.json(
        { error: 'MEGA storage not configured' },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { materialId } = body;

    if (!materialId) {
      return NextResponse.json({ error: 'materialId is required' }, { status: 400 });
    }

    // Get material from database
    const material = await prisma.material.findUnique({
      where: { id: materialId },
    });

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    // Check if already in MEGA
    if (material.storageType === 'EXTERNAL_MEGA') {
      return NextResponse.json({
        success: true,
        message: 'File already in MEGA',
        data: { externalUrl: material.externalUrl },
      });
    }

    // Check if file is in Supabase
    if (material.storageType !== 'SUPABASE' || !material.filePath) {
      return NextResponse.json(
        { error: 'Material is not in Supabase storage' },
        { status: 400 }
      );
    }

    logger.info('Starting migration to MEGA', {
      materialId: material.id,
      fileName: material.fileName,
      filePath: material.filePath,
    });

    // Download file from Supabase
    if (!supabaseAdmin) {
      throw new Error('Supabase not configured');
    }

    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from(material.storageBucket || 'materials')
      .download(material.filePath);

    if (downloadError || !fileData) {
      logger.error('Failed to download from Supabase', downloadError);
      throw new Error('Failed to download file from Supabase');
    }

    // Convert Blob to File
    const file = new File([fileData], material.fileName, {
      type: material.fileType,
    });

    logger.info('File downloaded from Supabase', {
      fileName: file.name,
      fileSize: file.size,
    });

    // Upload to MEGA
    const { url: megaUrl, accountId: megaAccountId } = await uploadToMega(file, material.fileName);

    logger.info('File uploaded to MEGA', {
      fileName: material.fileName,
      megaUrl,
      megaAccountId,
    });

    // Update database
    await prisma.material.update({
      where: { id: material.id },
      data: {
        storageType: 'EXTERNAL_MEGA',
        externalUrl: megaUrl,
        megaAccountId: megaAccountId,
      },
    });

    // Delete from Supabase to save space
    try {
      const { error: deleteError } = await supabaseAdmin.storage
        .from(material.storageBucket || 'materials')
        .remove([material.filePath]);

      if (deleteError) {
        logger.warn('Failed to delete from Supabase (non-critical)', deleteError);
      } else {
        logger.info('File deleted from Supabase', { filePath: material.filePath });
      }
    } catch (deleteErr) {
      logger.warn('Error deleting from Supabase (non-critical)', { error: deleteErr });
    }

    return NextResponse.json({
      success: true,
      message: 'File successfully migrated to MEGA',
      data: {
        materialId: material.id,
        fileName: material.fileName,
        externalUrl: megaUrl,
        storageType: 'EXTERNAL_MEGA',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Migration failed';
    logger.error('Migration to MEGA failed', error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// GET - Check migration status for a material
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const materialId = searchParams.get('materialId');

    if (!materialId) {
      return NextResponse.json({ error: 'materialId is required' }, { status: 400 });
    }

    const material = await prisma.material.findUnique({
      where: { id: materialId },
      select: {
        id: true,
        fileName: true,
        storageType: true,
        externalUrl: true,
      },
    });

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        materialId: material.id,
        fileName: material.fileName,
        storageType: material.storageType,
        inMega: material.storageType === 'EXTERNAL_MEGA',
        externalUrl: material.externalUrl,
      },
    });
  } catch (error) {
    logger.error('Failed to check migration status', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
