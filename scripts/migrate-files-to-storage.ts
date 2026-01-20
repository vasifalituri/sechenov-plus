/**
 * Migration Script: Migrate files from local filesystem to Supabase Storage
 * 
 * This script migrates:
 * 1. Profile images from public/uploads/profiles/ to Supabase profiles bucket
 * 2. Materials from public/uploads/ to Supabase materials bucket (if <100MB) or MEGA (if >100MB)
 * 
 * Usage:
 *   npx ts-node scripts/migrate-files-to-storage.ts [--dry-run] [--profiles-only] [--materials-only]
 * 
 * Options:
 *   --dry-run: Show what would be migrated without actually migrating
 *   --profiles-only: Only migrate profile images
 *   --materials-only: Only migrate materials
 */

import { PrismaClient } from '@prisma/client';
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'materials';
const PROFILES_BUCKET = process.env.SUPABASE_PROFILES_BUCKET || 'profiles';

const prisma = new PrismaClient();

interface MigrationStats {
  profileImages: {
    total: number;
    migrated: number;
    failed: number;
  };
  materials: {
    total: number;
    migratedToSupabase: number;
    migratedToMega: number;
    failed: number;
  };
}

const stats: MigrationStats = {
  profileImages: { total: 0, migrated: 0, failed: 0 },
  materials: { total: 0, migratedToSupabase: 0, migratedToMega: 0, failed: 0 },
};

const MAX_SUPABASE_SIZE = 100 * 1024 * 1024; // 100MB
const isDryRun = process.argv.includes('--dry-run');
const profilesOnly = process.argv.includes('--profiles-only');
const materialsOnly = process.argv.includes('--materials-only');

console.log('🚀 Starting file migration to cloud storage...');
console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE MIGRATION'}`);
console.log('');

/**
 * Migrate profile images
 */
async function migrateProfileImages() {
  console.log('📸 Migrating profile images...');
  
  const profilesDir = join(process.cwd(), 'public', 'uploads', 'profiles');
  
  try {
    const files = await readdir(profilesDir);
    stats.profileImages.total = files.length;

    console.log(`Found ${files.length} profile images`);

    for (const filename of files) {
      if (filename === '.gitkeep') continue;

      try {
        const filePath = join(profilesDir, filename);
        const fileStats = await stat(filePath);
        
        console.log(`  Processing: ${filename} (${(fileStats.size / 1024).toFixed(2)} KB)`);

        if (isDryRun) {
          console.log(`    [DRY RUN] Would upload to Supabase profiles bucket`);
          stats.profileImages.migrated++;
          continue;
        }

        // Read file
        const fileBuffer = await readFile(filePath);
        const fileBlob = new Blob([fileBuffer]);
        
        // Detect MIME type from filename
        const ext = filename.split('.').pop()?.toLowerCase();
        const mimeTypes: Record<string, string> = {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'webp': 'image/webp',
        };
        const mimeType = mimeTypes[ext || ''] || 'image/jpeg';

        // Extract user ID from filename (format: profile-{userId}-{timestamp}.{ext})
        const userIdMatch = filename.match(/profile-([a-f0-9-]+)-/);
        const userId = userIdMatch ? userIdMatch[1] : 'unknown';
        
        // Upload to Supabase
        const storagePath = `${userId}/${filename}`;
        const { data, error } = await supabaseAdmin.storage
          .from(PROFILES_BUCKET)
          .upload(storagePath, fileBlob, {
            contentType: mimeType,
            cacheControl: '3600',
            upsert: false,
          });

        if (error) {
          throw error;
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
          .from(PROFILES_BUCKET)
          .getPublicUrl(storagePath);

        // Update user record in database
        if (userId !== 'unknown') {
          await prisma.user.update({
            where: { id: userId },
            data: { profileImage: urlData.publicUrl },
          });
        }

        console.log(`    ✅ Migrated to Supabase: ${urlData.publicUrl}`);
        stats.profileImages.migrated++;
      } catch (error) {
        console.error(`    ❌ Failed to migrate ${filename}:`, error);
        stats.profileImages.failed++;
      }
    }
  } catch (error) {
    console.error('Error reading profiles directory:', error);
  }

  console.log('');
}

/**
 * Migrate materials
 */
async function migrateMaterials() {
  console.log('📚 Migrating materials...');
  
  // Find all materials with LOCAL storage type or old file paths
  const materials = await prisma.material.findMany({
    where: {
      OR: [
        { storageType: 'LOCAL' },
        { filePath: { startsWith: '/uploads/' } },
        { filePath: { startsWith: 'uploads/' } },
      ],
    },
  });

  stats.materials.total = materials.length;
  console.log(`Found ${materials.length} materials to migrate`);

  for (const material of materials) {
    try {
      const filePath = join(process.cwd(), 'public', material.filePath);
      const fileStats = await stat(filePath);
      const fileSizeMB = (fileStats.size / 1024 / 1024).toFixed(2);
      
      console.log(`  Processing: ${material.fileName} (${fileSizeMB} MB)`);

      if (isDryRun) {
        if (fileStats.size > MAX_SUPABASE_SIZE) {
          console.log(`    [DRY RUN] Would upload to MEGA (large file)`);
        } else {
          console.log(`    [DRY RUN] Would upload to Supabase materials bucket`);
        }
        stats.materials.migratedToSupabase++;
        continue;
      }

      // Read file
      const fileBuffer = await readFile(filePath);
      
      if (fileStats.size > MAX_SUPABASE_SIZE) {
        // Large file: Skip MEGA upload in migration (requires browser File API)
        console.log(`    ⚠️  Large file detected (${fileSizeMB}MB)`);
        console.log(`    ⏭️  Skipping MEGA upload (requires manual re-upload via web interface)`);
        
        // Mark for manual re-upload
        const externalUrl = '';

        if (!isDryRun) {
          // Update database to mark for re-upload
          await prisma.material.update({
            where: { id: material.id },
            data: {
              status: 'PENDING', // Mark as pending for admin to re-approve after re-upload
            },
          });
        }

        console.log(`    ℹ️  Material will need manual re-upload via web interface`);
        stats.materials.failed++;
      } else {
        // Small/medium file: Upload to Supabase
        console.log(`    📦 Uploading to Supabase...`);
        
        const timestamp = Date.now();
        const storagePath = `migrated/${material.uploadedById}/${timestamp}-${material.fileName}`;
        
        const { data, error } = await supabaseAdmin.storage
          .from(STORAGE_BUCKET)
          .upload(storagePath, fileBuffer, {
            contentType: material.fileType === 'PDF' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            cacheControl: '3600',
            upsert: false,
          });

        if (error) {
          throw error;
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(storagePath);

        // Update database
        await prisma.material.update({
          where: { id: material.id },
          data: {
            storageType: 'SUPABASE',
            filePath: storagePath,
            storageBucket: STORAGE_BUCKET,
            externalUrl: null,
          },
        });

        console.log(`    ✅ Migrated to Supabase: ${urlData.publicUrl}`);
        stats.materials.migratedToSupabase++;
      }
    } catch (error) {
      console.error(`    ❌ Failed to migrate ${material.fileName}:`, error);
      stats.materials.failed++;
    }
  }

  console.log('');
}

/**
 * Main migration function
 */
async function main() {
  try {
    if (!materialsOnly) {
      await migrateProfileImages();
    }

    if (!profilesOnly) {
      await migrateMaterials();
    }

    // Print summary
    console.log('📊 Migration Summary:');
    console.log('='.repeat(50));
    
    if (!materialsOnly) {
      console.log('Profile Images:');
      console.log(`  Total: ${stats.profileImages.total}`);
      console.log(`  Migrated: ${stats.profileImages.migrated}`);
      console.log(`  Failed: ${stats.profileImages.failed}`);
      console.log('');
    }

    if (!profilesOnly) {
      console.log('Materials:');
      console.log(`  Total: ${stats.materials.total}`);
      console.log(`  Migrated to Supabase: ${stats.materials.migratedToSupabase}`);
      console.log(`  Migrated to MEGA: ${stats.materials.migratedToMega}`);
      console.log(`  Failed: ${stats.materials.failed}`);
      console.log('');
    }

    if (isDryRun) {
      console.log('✨ Dry run completed. No changes were made.');
      console.log('   Run without --dry-run to perform actual migration.');
    } else {
      console.log('✅ Migration completed!');
      console.log('');
      console.log('Next steps:');
      console.log('1. Verify files in Supabase Dashboard');
      console.log('2. Test downloading files from the application');
      console.log('3. Once verified, you can delete old files from public/uploads/');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
main();
