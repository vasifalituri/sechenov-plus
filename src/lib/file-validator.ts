/**
 * File validation utilities using magic bytes
 * to prevent file type spoofing
 */

interface FileSignature {
  mime: string;
  extension: string;
  signature: number[];
  offset?: number;
}

// Common file signatures (magic bytes)
const FILE_SIGNATURES: FileSignature[] = [
  // PDF
  {
    mime: 'application/pdf',
    extension: 'pdf',
    signature: [0x25, 0x50, 0x44, 0x46], // %PDF
    offset: 0,
  },
  // DOCX (ZIP-based)
  {
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extension: 'docx',
    signature: [0x50, 0x4B, 0x03, 0x04], // PK.. (ZIP header)
    offset: 0,
  },
  // DOC (older Word format)
  {
    mime: 'application/msword',
    extension: 'doc',
    signature: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1],
    offset: 0,
  },
];

/**
 * Check if buffer starts with the given signature
 */
function checkSignature(buffer: Buffer, signature: FileSignature): boolean {
  const offset = signature.offset || 0;
  
  if (buffer.length < offset + signature.signature.length) {
    return false;
  }

  for (let i = 0; i < signature.signature.length; i++) {
    if (buffer[offset + i] !== signature.signature[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Validate file type using magic bytes
 * @param buffer - File buffer to check
 * @param expectedMime - Expected MIME type
 * @returns true if file matches expected type
 */
export function validateFileType(buffer: Buffer, expectedMime: string): boolean {
  const signatures = FILE_SIGNATURES.filter(sig => sig.mime === expectedMime);
  
  if (signatures.length === 0) {
    // No signature defined for this type, skip validation
    return true;
  }

  // Check if buffer matches any of the signatures for this MIME type
  return signatures.some(sig => checkSignature(buffer, sig));
}

/**
 * Detect actual file type from buffer
 * @param buffer - File buffer to analyze
 * @returns Detected MIME type or null
 */
export function detectFileType(buffer: Buffer): string | null {
  for (const signature of FILE_SIGNATURES) {
    if (checkSignature(buffer, signature)) {
      return signature.mime;
    }
  }
  return null;
}

/**
 * Validate file with comprehensive checks
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
  detectedType?: string | null;
}

export function validateFile(
  buffer: Buffer,
  declaredMime: string,
  declaredName: string,
  maxSize: number
): FileValidationResult {
  // Check size
  if (buffer.length > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`,
    };
  }

  // Detect actual file type
  const detectedType = detectFileType(buffer);

  // Check if declared type matches detected type
  if (detectedType && detectedType !== declaredMime) {
    // Special case: DOCX files are ZIP files, so they might match ZIP signature
    if (!(declaredMime.includes('wordprocessingml') && detectedType.includes('zip'))) {
      return {
        valid: false,
        error: 'File type mismatch. The file content does not match the declared type.',
        detectedType,
      };
    }
  }

  // Validate magic bytes match declared type
  if (!validateFileType(buffer, declaredMime)) {
    return {
      valid: false,
      error: 'Invalid file format. The file may be corrupted or not a valid document.',
      detectedType,
    };
  }

  return { valid: true, detectedType: detectedType || undefined };
}
