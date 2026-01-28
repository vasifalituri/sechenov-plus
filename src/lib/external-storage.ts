/**
 * External Storage Integration (MEGA)
 * Handles file uploads to MEGA for large files (>100MB)
 * Supports multiple MEGA accounts for increased storage capacity
 */

import { logger } from './logger';

// MEGA account configuration interface
interface MegaAccount {
  id: number;
  email: string;
  password: string;
  folderName: string;
}

// Load all configured MEGA accounts
function loadMegaAccounts(): MegaAccount[] {
  const accounts: MegaAccount[] = [];
  
  // Check for numbered accounts first (MEGA_EMAIL_1, MEGA_EMAIL_2, etc.)
  let accountIndex = 1;
  while (true) {
    const email = process.env[`MEGA_EMAIL_${accountIndex}`];
    const password = process.env[`MEGA_PASSWORD_${accountIndex}`];
    
    if (!email || !password) break;
    
    accounts.push({
      id: accountIndex,
      email,
      password,
      folderName: process.env[`MEGA_FOLDER_NAME_${accountIndex}`] || 'sechenov-plus-materials',
    });
    
    accountIndex++;
  }
  
  // Fallback to legacy single account if no numbered accounts found
  if (accounts.length === 0) {
    const email = process.env.MEGA_EMAIL;
    const password = process.env.MEGA_PASSWORD;
    
    if (email && password) {
      accounts.push({
        id: 1,
        email,
        password,
        folderName: process.env.MEGA_FOLDER_NAME || 'sechenov-plus-materials',
      });
    }
  }
  
  return accounts;
}

// Cache loaded accounts
let cachedAccounts: MegaAccount[] | null = null;

/**
 * Get all configured MEGA accounts
 */
export function getMegaAccounts(): MegaAccount[] {
  if (!cachedAccounts) {
    cachedAccounts = loadMegaAccounts();
  }
  return cachedAccounts;
}

/**
 * Check if MEGA is configured
 */
export function isMegaConfigured(): boolean {
  const accounts = getMegaAccounts();
  return accounts.length > 0;
}

/**
 * Get a specific MEGA account by ID
 */
export function getMegaAccount(accountId: number): MegaAccount | null {
  const accounts = getMegaAccounts();
  return accounts.find(acc => acc.id === accountId) || null;
}

// Counter for round-robin account selection
let accountCounter = 0;

/**
 * Select next MEGA account using round-robin
 */
export function selectMegaAccount(): MegaAccount {
  const accounts = getMegaAccounts();
  
  if (accounts.length === 0) {
    throw new Error('No MEGA accounts configured');
  }
  
  // Round-robin: rotate through accounts
  const selectedAccount = accounts[accountCounter % accounts.length];
  accountCounter++;
  
  logger.info('Selected MEGA account for upload', { 
    accountId: selectedAccount.id, 
    email: selectedAccount.email.substring(0, 3) + '***' // Log partial email for privacy
  });
  
  return selectedAccount;
}

/**
 * Upload file to MEGA storage
 * @param file - File to upload
 * @param fileName - Name for the file
 * @param accountId - Optional: specific account to use (otherwise auto-selects)
 * @returns Object with download URL and account ID used
 */
export async function uploadToMega(
  file: File, 
  fileName: string, 
  accountId?: number
): Promise<{ url: string; accountId: number }> {
  if (!isMegaConfigured()) {
    throw new Error('MEGA storage is not configured. Please set MEGA_EMAIL and MEGA_PASSWORD in environment variables.');
  }

  try {
    // Select account: use specified or auto-select via round-robin
    const account = accountId 
      ? getMegaAccount(accountId) 
      : selectMegaAccount();
    
    if (!account) {
      throw new Error(`MEGA account ${accountId} not found`);
    }

    logger.info('Uploading to MEGA account', { 
      accountId: account.id, 
      fileName, 
      size: file.size 
    });

    // For now, we'll use the MEGA npm package
    // Note: This requires 'megajs' package to be installed
    const { Storage } = await import('megajs');
    
    const storage = await new Storage({
      email: account.email,
      password: account.password,
    }).ready;

    logger.info('Connected to MEGA storage', { accountId: account.id });

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Find or create folder
    let targetFolder = storage.root;
    if (account.folderName) {
      // Children are already loaded when storage is ready
      const existingFolder = storage.root.children?.find(
        (node: any) => node.name === account.folderName && node.directory
      );
      
      if (existingFolder) {
        targetFolder = existingFolder;
        logger.info('Found existing MEGA folder', { 
          folderName: account.folderName,
          accountId: account.id 
        });
      } else {
        logger.info('Creating MEGA folder', { 
          folderName: account.folderName,
          accountId: account.id 
        });
        targetFolder = await storage.mkdir(account.folderName);
        logger.info('Created MEGA folder', { 
          folderName: account.folderName,
          accountId: account.id 
        });
      }
    }

    // Upload file to the target folder using folder's upload method
    logger.info('Uploading to MEGA', { 
      fileName, 
      size: file.size, 
      folder: account.folderName || 'root',
      accountId: account.id 
    });
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
    
    logger.info('File uploaded to MEGA successfully', { 
      fileName, 
      link, 
      accountId: account.id 
    });

    return { url: link, accountId: account.id };
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
