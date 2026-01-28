import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin, STORAGE_BUCKET, isSupabaseConfigured } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || session.user.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const material = await prisma.material.findUnique({
      where: { id },
    });

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    // Allow admins to download any material, regular users only approved materials
    const isAdmin = session.user.role === 'ADMIN';
    if (!isAdmin && material.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Material not available' }, { status: 403 });
    }

    // Track unique download (one per user per material)
    try {
      await prisma.materialDownload.upsert({
        where: {
          materialId_userId: {
            materialId: id,
            userId: session.user.id,
          },
        },
        create: {
          materialId: id,
          userId: session.user.id,
        },
        update: {
          downloadedAt: new Date(), // Update timestamp if already downloaded
        },
      });

      // Update download count to reflect unique users
      const uniqueDownloads = await prisma.materialDownload.count({
        where: { materialId: id },
      });

      await prisma.material.update({
        where: { id },
        data: { downloadCount: uniqueDownloads },
      });
    } catch (error) {
      logger.error('Error tracking download:', error);
      // Continue with download even if tracking fails
    }

    // Handle different storage types
    if (material.storageType === 'EXTERNAL_MEGA') {
      // For external storage, return the MEGA URL so frontend can open it in new tab
      if (!material.externalUrl) {
        return NextResponse.json({ error: 'External URL not found' }, { status: 404 });
      }
      
      logger.info('Returning MEGA URL for client-side redirect', {
        materialId: id,
        storageType: material.storageType,
      });

      // Return JSON with MEGA URL instead of redirecting
      // Frontend will open this in a new tab
      return NextResponse.json({
        success: true,
        downloadType: 'EXTERNAL_MEGA',
        externalUrl: material.externalUrl,
        fileName: material.fileName,
      });
    } else if (material.storageType === 'SUPABASE') {
      // Download from Supabase Storage
      try {
        if (!isSupabaseConfigured() || !supabaseAdmin) {
          logger.error('Supabase not configured, falling back to local storage');
          throw new Error('Supabase not configured');
        }
        
        const bucket = material.storageBucket || STORAGE_BUCKET;
        const { data, error } = await supabaseAdmin.storage
          .from(bucket)
          .download(material.filePath);

        if (error) {
          logger.error('Error downloading from Supabase:', error);
          throw new Error(`Download failed: ${error.message}`);
        }

        // Convert blob to buffer
        const arrayBuffer = await data.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Set appropriate headers
        const headers = new Headers();
        headers.set('Content-Type', material.fileType === 'PDF' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        headers.set('Content-Disposition', `attachment; filename="${material.fileName}"`);
        headers.set('Content-Length', buffer.length.toString());

        logger.info('Downloaded material from Supabase', {
          materialId: id,
          fileSize: buffer.length,
        });

        return new NextResponse(buffer, { headers });
      } catch (supabaseError) {
        logger.error('Error downloading from Supabase, trying fallback:', supabaseError);
        // Fallback to local if Supabase fails
      }
    }

    // Fallback: LOCAL storage (legacy support for migration)
    try {
      const filePath = join(process.cwd(), 'public', material.filePath);
      
      if (!existsSync(filePath)) {
        logger.error('File not found in local storage', { filePath, materialId: id });
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }

      const fileBuffer = await readFile(filePath);

      // Set appropriate headers
      const headers = new Headers();
      headers.set('Content-Type', material.fileType === 'PDF' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      headers.set('Content-Disposition', `attachment; filename="${material.fileName}"`);

      logger.info('Downloaded material from local storage (legacy)', {
        materialId: id,
      });

      return new NextResponse(fileBuffer, { headers });
    } catch (localError) {
      logger.error('Error downloading material from local storage:', localError);
      return NextResponse.json(
        { error: 'Failed to download material' },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Error downloading material:', error);
    return NextResponse.json(
      { error: 'Failed to download material' },
      { status: 500 }
    );
  }
}
