import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadToMega, isMegaConfigured } from '@/lib/external-storage';
import { logger } from '@/lib/logger';
import { rateLimit, createRateLimitResponse, getClientIdentifier } from '@/lib/rate-limit';
import busboy from 'busboy';
import { Readable } from 'stream';

// Next.js App Router route segment config
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for large file uploads
export const dynamic = 'force-dynamic';

// POST - Upload large file to external storage (MEGA)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting: 5 large file uploads per day per user
    const identifier = getClientIdentifier(req, session.user.id);
    const rateLimitResult = await rateLimit(identifier, {
      interval: 24 * 60 * 60 * 1000, // 24 hours
      uniqueTokenPerInterval: 500,
      maxRequests: 5,
    });
    
    const rateLimitResponse = createRateLimitResponse(rateLimitResult);
    if (rateLimitResponse) return rateLimitResponse;

    // Check if MEGA is configured
    if (!isMegaConfigured()) {
      logger.error('MEGA storage not configured');
      return NextResponse.json(
        { error: 'External storage is not configured. Please contact administrator.' },
        { status: 503 }
      );
    }

    // Maximum file size: 10MB
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB

    // Validate content type
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    // Check if request body exists
    if (!req.body) {
      return NextResponse.json({ error: 'No request body' }, { status: 400 });
    }

    // Parse multipart form data using busboy with direct streaming
    // IMPORTANT: Do NOT use req.arrayBuffer() - pipe req.body directly
    const bb = busboy({
      headers: {
        'content-type': contentType,
      },
      limits: {
        fileSize: MAX_SIZE,
        files: 1,
        fields: 0,
      },
    });

    let file: File | null = null;
    let fileName = '';
    let fileType = '';
    let fileChunks: Buffer[] = [];
    let totalSize = 0;
    let fileSizeExceeded = false;
    let parseError: Error | null = null;

    const parsePromise = new Promise<void>((resolve, reject) => {
      bb.on('file', (fieldname, fileStream, info) => {
        const { filename, mimeType } = info;
        fileName = filename;
        fileType = mimeType;

        logger.info('Receiving file', {
          fileName: filename,
          fileType: mimeType,
          userId: session.user.id,
        });

        fileStream.on('data', (chunk: Buffer) => {
          if (!fileSizeExceeded) {
            fileChunks.push(chunk);
            totalSize += chunk.length;
          }
        });

        fileStream.on('limit', () => {
          fileSizeExceeded = true;
          logger.warn('File size limit exceeded', { fileName, limit: MAX_SIZE });
          parseError = new Error(`File size too large. Maximum size is ${MAX_SIZE / 1024 / 1024}MB.`);
          fileStream.resume(); // Drain the stream
        });

        fileStream.on('end', () => {
          logger.info('File stream ended', {
            fileName,
            chunks: fileChunks.length,
            totalSize,
          });
        });

        fileStream.on('error', (error: Error) => {
          logger.error('File stream error:', error);
          parseError = error;
        });
      });

      bb.on('error', (error: Error) => {
        logger.error('Busboy error:', error);
        parseError = error;
        reject(error);
      });

      bb.on('close', () => {
        logger.info('Busboy close event');
        if (parseError) {
          reject(parseError);
        } else if (fileSizeExceeded) {
          reject(new Error(`File size too large. Maximum size is ${MAX_SIZE / 1024 / 1024}MB.`));
        } else {
          resolve();
        }
      });
    });

    // Convert Web ReadableStream to Node.js Readable and pipe to busboy
    // This is the KEY: Use Readable.fromWeb to properly handle the stream
    try {
      const nodeStream = Readable.fromWeb(req.body as any);
      nodeStream.pipe(bb);
      
      await parsePromise;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to parse file';
      logger.error('Error parsing multipart data:', error);
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    // Validate we received a file
    if (!fileName || fileChunks.length === 0) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Combine chunks into single buffer and create File object
    const fileBuffer = Buffer.concat(fileChunks);
    file = new File([fileBuffer], fileName, { type: fileType });

    logger.info('File parsed successfully', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      userId: session.user.id,
    });

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF and Word documents are allowed.' },
        { status: 400 }
      );
    }

    // Upload to MEGA
    logger.info('Uploading to MEGA', {
      fileName: file.name,
      fileSize: file.size,
      userId: session.user.id,
    });

    const externalUrl = await uploadToMega(file, file.name);

    logger.info('File uploaded to MEGA successfully', {
      fileName: file.name,
      fileSize: file.size,
      externalUrl: externalUrl,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        externalUrl: externalUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        storageType: 'EXTERNAL_MEGA',
      },
      message: 'Файл успешно загружен во внешнее хранилище',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
    logger.error('Error uploading to external storage:', error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
