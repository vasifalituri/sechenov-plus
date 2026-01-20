import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if Supabase is configured
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
}

// Client-side Supabase client (uses anon key, safe for browser)
// Use dummy values if not configured to prevent runtime errors
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Server-side Supabase client (uses service role key, more permissions)
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || supabaseAnonKey || 'placeholder-key'
);

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'materials';
export const PROFILES_BUCKET = process.env.SUPABASE_PROFILES_BUCKET || 'profiles';
export const MAX_SUPABASE_FILE_SIZE = parseInt(process.env.MAX_SUPABASE_FILE_SIZE || '104857600'); // 100MB

// Helper to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

/**
 * Upload file directly to Supabase Storage from client
 * @param file - File to upload
 * @param path - Storage path (e.g., "materials/uuid-filename.pdf")
 * @returns Public URL or error
 */
export async function uploadFileToSupabase(file: File, path: string) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Please check your environment variables.');
  }
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  return {
    path: data.path,
    publicUrl: urlData.publicUrl,
  };
}

/**
 * Delete file from Supabase Storage (server-side only)
 */
export async function deleteFileFromSupabase(path: string) {
  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .remove([path]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

/**
 * Get signed URL for private files (if needed later)
 */
export async function getSignedUrl(path: string, expiresIn = 3600, bucket: string = STORAGE_BUCKET) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Failed to get signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Upload profile image to Supabase Storage
 * @param file - Image file to upload
 * @param userId - User ID for path naming
 * @returns Public URL or error
 */
export async function uploadProfileImage(file: File, userId: string) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Please check your environment variables.');
  }

  // Validate file size (max 5MB for profile images)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('Profile image must be less than 5MB');
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only JPEG, PNG, and WebP images are allowed');
  }

  // Generate unique filename
  const timestamp = Date.now();
  const extension = file.name.split('.').pop();
  const path = `${userId}/profile-${timestamp}.${extension}`;

  const { data, error } = await supabaseAdmin.storage
    .from(PROFILES_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabaseAdmin.storage
    .from(PROFILES_BUCKET)
    .getPublicUrl(path);

  return {
    path: data.path,
    publicUrl: urlData.publicUrl,
  };
}

/**
 * Delete profile image from Supabase Storage
 */
export async function deleteProfileImage(path: string) {
  const { error } = await supabaseAdmin.storage
    .from(PROFILES_BUCKET)
    .remove([path]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}
