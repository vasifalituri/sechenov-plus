/**
 * Apply storage migration manually
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function applyMigration() {
  console.log('🔧 Applying storage migration...\n');

  try {
    // Check if StorageType enum exists
    const enumCheck = await prisma.$queryRaw`
      SELECT 1 FROM pg_type WHERE typname = 'StorageType'
    `;

    if (Array.isArray(enumCheck) && enumCheck.length > 0) {
      console.log('✅ StorageType enum already exists');
    } else {
      console.log('📝 Creating StorageType enum...');
      await prisma.$executeRaw`
        CREATE TYPE "StorageType" AS ENUM ('SUPABASE', 'EXTERNAL_MEGA', 'LOCAL')
      `;
      console.log('✅ StorageType enum created');
    }

    // Check if columns exist
    const columnCheck: any[] = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'materials' 
      AND column_name IN ('storageType', 'storageBucket', 'externalUrl')
    `;

    if (columnCheck.length === 3) {
      console.log('✅ Storage columns already exist');
    } else {
      console.log('📝 Adding storage columns...');
      await prisma.$executeRaw`
        ALTER TABLE "materials" 
        ADD COLUMN IF NOT EXISTS "storageType" "StorageType" NOT NULL DEFAULT 'SUPABASE',
        ADD COLUMN IF NOT EXISTS "storageBucket" TEXT,
        ADD COLUMN IF NOT EXISTS "externalUrl" TEXT
      `;
      console.log('✅ Storage columns added');
    }

    // Update existing materials
    console.log('📝 Updating existing materials...');
    const result = await prisma.$executeRaw`
      UPDATE "materials" 
      SET "storageType" = 'LOCAL'::"StorageType"
      WHERE "filePath" LIKE '/uploads/%' OR "filePath" LIKE 'uploads/%'
    `;
    console.log(`✅ Updated ${result} materials to LOCAL storage type`);

    // Mark migration as applied in Prisma (skip if already marked)
    console.log('\n📝 Marking migration as applied...');
    try {
      await prisma.$executeRaw`
        INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
        VALUES (
          gen_random_uuid(),
          '0',
          NOW(),
          '20260120134800_add_storage_type_fields',
          NULL,
          NULL,
          NOW(),
          1
        )
      `;
      console.log('✅ Migration marked as applied');
    } catch (e) {
      console.log('⚠️  Migration might already be marked (skipping)');
    }

    console.log('\n✅ Storage migration applied successfully!');
    console.log('\n🎯 Next steps:');
    console.log('   1. Run: npx prisma generate');
    console.log('   2. Run: npm run migrate:storage:dry-run');
    console.log('   3. Run: npm run migrate:storage');

  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
