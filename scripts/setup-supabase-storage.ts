/**
 * Setup Script: Check and create Supabase Storage buckets
 * 
 * This script will:
 * 1. Check if Supabase is configured
 * 2. Check if required buckets exist
 * 3. Create buckets if they don't exist
 * 4. Show next steps
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(
  supabaseUrl || '',
  supabaseServiceKey || ''
);

const REQUIRED_BUCKETS = [
  {
    name: 'profiles',
    public: true,
    description: 'Profile images (<5MB)',
  },
  {
    name: 'materials',
    public: false,
    description: 'Study materials (<100MB)',
  },
];

async function setupSupabaseStorage() {
  console.log('🚀 Checking Supabase Storage setup...\n');

  // Check if Supabase is configured
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase is not configured!');
    console.log('\nPlease add these to your .env.local:');
    console.log('  NEXT_PUBLIC_SUPABASE_URL=your-supabase-url');
    console.log('  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
    process.exit(1);
  }

  console.log('✅ Supabase credentials found');
  console.log(`   URL: ${supabaseUrl}\n`);

  // Check buckets
  try {
    const { data: existingBuckets, error } = await supabaseAdmin.storage.listBuckets();

    if (error) {
      console.error('❌ Error listing buckets:', error.message);
      console.log('\n⚠️  This might mean:');
      console.log('   1. Invalid SUPABASE_SERVICE_ROLE_KEY');
      console.log('   2. Network connection issue');
      console.log('   3. Supabase project is paused/inactive\n');
      process.exit(1);
    }

    console.log('📦 Existing buckets:');
    if (existingBuckets && existingBuckets.length > 0) {
      existingBuckets.forEach(bucket => {
        console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });
    } else {
      console.log('   (none)');
    }
    console.log('');

    // Check and create required buckets
    for (const bucketConfig of REQUIRED_BUCKETS) {
      const exists = existingBuckets?.some(b => b.name === bucketConfig.name);

      if (exists) {
        console.log(`✅ Bucket '${bucketConfig.name}' already exists`);
        console.log(`   ${bucketConfig.description}`);
      } else {
        console.log(`⚠️  Bucket '${bucketConfig.name}' does not exist`);
        console.log(`   Creating ${bucketConfig.public ? 'public' : 'private'} bucket...`);

        const { data, error } = await supabaseAdmin.storage.createBucket(bucketConfig.name, {
          public: bucketConfig.public,
          fileSizeLimit: bucketConfig.name === 'profiles' ? 5242880 : 104857600, // 5MB or 100MB
        });

        if (error) {
          console.error(`   ❌ Error creating bucket: ${error.message}`);
        } else {
          console.log(`   ✅ Bucket '${bucketConfig.name}' created successfully!`);
        }
      }
      console.log('');
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✨ Supabase Storage Setup Complete!');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📋 Next Steps:\n');
    
    console.log('1️⃣  Configure MEGA (for large files >100MB):');
    console.log('   - Go to https://mega.nz and register');
    console.log('   - Add your credentials to .env.local:');
    console.log('     MEGA_EMAIL=your-email@example.com');
    console.log('     MEGA_PASSWORD=your-password\n');

    console.log('2️⃣  Set up RLS policies (optional but recommended):');
    console.log('   - Go to Supabase Dashboard → Storage → materials → Policies');
    console.log('   - See STORAGE_MIGRATION.md for SQL policies\n');

    console.log('3️⃣  Test the system:');
    console.log('   - Restart dev server: npm run dev');
    console.log('   - Upload a profile image');
    console.log('   - Upload a small material (<100MB)');
    console.log('   - Follow TESTING_STORAGE.md for full testing\n');

    console.log('4️⃣  Migrate existing files (if any):');
    console.log('   - Preview: npm run migrate:storage:dry-run');
    console.log('   - Migrate: npm run migrate:storage\n');

    console.log('📚 Documentation:');
    console.log('   - Quick setup: STORAGE_SETUP.md');
    console.log('   - Full guide: STORAGE_MIGRATION.md');
    console.log('   - Testing: TESTING_STORAGE.md\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run setup
setupSupabaseStorage();
