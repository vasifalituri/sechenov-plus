/**
 * Client-side file compression utilities
 * Compresses PDF and DOCX files in the browser before upload
 */

import { PDFDocument } from 'pdf-lib';
import imageCompression from 'browser-image-compression';

export interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number; // percentage saved
  shouldUseCompressed: boolean; // true if compression saved significant space
}

const MINIMUM_COMPRESSION_THRESHOLD = 0.1; // Only use compressed if saves at least 10%

/**
 * Compress PDF by optimizing images inside
 */
export async function compressPDF(file: File): Promise<CompressionResult> {
  const originalSize = file.size;

  try {
    // Read PDF
    const inputBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(inputBuffer);

    // Note: pdf-lib doesn't have built-in image compression
    // For now, we'll try to optimize by removing unused objects
    // In a production app, you'd use a more sophisticated library
    
    // Save optimized PDF
    const pdfBytes = await pdfDoc.save({
      useObjectStreams: true, // Compress objects
    });

    const compressedSize = pdfBytes.byteLength;
    const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;
    const shouldUseCompressed = compressionRatio >= MINIMUM_COMPRESSION_THRESHOLD * 100;

    // Create new File object (convert Uint8Array to ArrayBuffer)
    const arrayBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
    const compressedFile = new File(
      [arrayBuffer],
      file.name,
      { type: 'application/pdf' }
    );

    return {
      compressedFile,
      originalSize,
      compressedSize,
      compressionRatio,
      shouldUseCompressed,
    };
  } catch (error) {
    console.error('PDF compression failed:', error);
    // Return original if compression fails
    return {
      compressedFile: file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
      shouldUseCompressed: false,
    };
  }
}

/**
 * Compress DOCX by optimizing images inside
 * DOCX is a ZIP archive containing XML and images
 */
export async function compressDOCX(file: File): Promise<CompressionResult> {
  const originalSize = file.size;

  try {
    // DOCX compression is complex (it's a ZIP with XML)
    // For a simple implementation, we'll use JSZip to extract, compress images, and repack
    // For now, return a minimal optimization or original file
    
    // This is a placeholder - full DOCX compression requires JSZip
    // and is quite complex. For MVP, we'll just return the original
    
    return {
      compressedFile: file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
      shouldUseCompressed: false,
    };
  } catch (error) {
    console.error('DOCX compression failed:', error);
    return {
      compressedFile: file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
      shouldUseCompressed: false,
    };
  }
}

/**
 * Main compression function - detects file type and applies appropriate compression
 */
export async function compressFile(file: File): Promise<CompressionResult> {
  const fileType = file.type;

  if (fileType === 'application/pdf') {
    return await compressPDF(file);
  } else if (
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileType === 'application/msword'
  ) {
    return await compressDOCX(file);
  }

  // Unsupported file type - return original
  return {
    compressedFile: file,
    originalSize: file.size,
    compressedSize: file.size,
    compressionRatio: 0,
    shouldUseCompressed: false,
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
