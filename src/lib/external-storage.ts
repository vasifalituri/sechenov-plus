/**
 * External Storage Integration (MEGA)
 * Handles file uploads to MEGA for large files (>100MB)
 */

import { logger } from './logger';

// MEGA configuration from environment
const MEGA_EMAIL = process.env.MEGA_EMAIL;
const MEGA_PASSWORD = process.env.MEGA_PASSWORD;
const MEGA_FOLDER_NAME = process.env.MEGA_FOLDER_NAME || 'sechenov-plus-materials';

/**
 * Check if MEGA is configured
 */
export function isMegaConfigured(): boolean {
  return !!(MEGA_EMAIL && MEGA_PASSWORD);
}

/**
 * Upload file to MEGA storage
 * @param file - File to upload
 * @param fileName - Name for the file
 * @returns Download URL for the file
 */
export async function uploadToMega(file: File, fileName: string): Promise<string> {
  if (!isMegaConfigured()) {
    throw new Error('MEGA storage is not configured. Please set MEGA_EMAIL and MEGA_PASSWORD in environment variables.');
  }

  try {
    // For now, we'll use the MEGA npm package
    // Note: This requires 'megajs' package to be installed
    const { Storage } = await import('megajs');
    
    const storage = await new Storage({
      email: MEGA_EMAIL!,
      password: MEGA_PASSWORD!,
    }).ready;

    logger.info('Connected to MEGA storage');

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Find or create folder
    let targetFolder = storage.root;
    if (MEGA_FOLDER_NAME) {
      // Children are already loaded when storage is ready
      const existingFolder = storage.root.children?.find(
        (node: any) => node.name === MEGA_FOLDER_NAME && node.directory
      );
      
      if (existingFolder) {
        targetFolder = existingFolder;
        logger.info('Found existing MEGA folder', { folderName: MEGA_FOLDER_NAME });
      } else {
        logger.info('Creating MEGA folder', { folderName: MEGA_FOLDER_NAME });
        targetFolder = await storage.mkdir(MEGA_FOLDER_NAME, storage.root);
        logger.info('Created MEGA folder', { folderName: MEGA_FOLDER_NAME });
      }
    }

    // Upload file to the target folder using folder's upload method
    logger.info('Uploading to MEGA', { fileName, size: file.size, folder: MEGA_FOLDER_NAME || 'root' });
    const uploadedFile = await targetFolder.upload({
      name: fileName,
      size: buffer.length,
    }, buffer).complete;

    // Get shareable link
    let link: string;
    try {
      // Try to get link directly (returns promise)
      link = await uploadedFile.link();
    } catch (error) {
      logger.error('Error generating MEGA link:', error);
      throw new Error(`Failed to generate download link: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    logger.info('File uploaded to MEGA successfully', { fileName, link });

    return link;
  } catch (error) {
    logger.error('Error uploading to MEGA:', error);
    throw new Error(`Failed to upload to MEGA: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete file from MEGA storage
 * @param fileUrl - MEGA file URL
 */
export async function deleteFromMega(fileUrl: string): Promise<void> {
  if (!isMegaConfigured()) {
    throw new Error('MEGA storage is not configured');
  }

  try {
    // MEGA deletion would require file handle/key
    // For now, we'll just log it
    logger.warn('MEGA file deletion not implemented yet', { fileUrl });
    // TODO: Implement MEGA file deletion if needed
  } catch (error) {
    logger.error('Error deleting from MEGA:', error);
    throw new Error(`Failed to delete from MEGA: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get file size limit for external storage
 */
export function getExternalStorageLimit(): number {
  // MEGA free tier: 20GB storage, but we'll use 10MB as reasonable limit per file
  return 10 * 1024 * 1024; // 10MB
}

/**
 * Determine if file should use external storage based on size
 * @param fileSize - Size in bytes
 */
export function shouldUseExternalStorage(fileSize: number): boolean {
  // ALL materials should use MEGA storage (not Supabase)
  return true;
}
