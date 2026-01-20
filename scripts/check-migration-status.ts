/**
 * Check migration status
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStatus() {
  console.log('📊 Checking migration status...\n');

  try {
    // Check materials
    const materials = await prisma.material.findMany({
      select: {
        id: true,
        fileName: true,
        storageType: true,
        fileSize: true,
      },
    });

    console.log('📚 Materials Status:');
    console.log('═'.repeat(80));
    
    const supabase = materials.filter(m => m.storageType === 'SUPABASE');
    const local = materials.filter(m => m.storageType === 'LOCAL');
    const mega = materials.filter(m => m.storageType === 'EXTERNAL_MEGA');
    
    console.log(`  Total materials: ${materials.length}`);
    console.log(`  ✅ Migrated to Supabase: ${supabase.length}`);
    console.log(`  ⏳ Still in LOCAL (needs migration): ${local.length}`);
    console.log(`  🌐 In MEGA: ${mega.length}\n`);

    if (local.length > 0) {
      console.log('⏳ Materials still in LOCAL storage:');
      local.forEach(m => {
        const sizeMB = (m.fileSize / 1024 / 1024).toFixed(2);
        console.log(`  - ${m.fileName} (${sizeMB} MB)`);
      });
      console.log('');
    }

    if (supabase.length > 0) {
      console.log('✅ Materials migrated to Supabase:');
      supabase.forEach(m => {
        const sizeMB = (m.fileSize / 1024 / 1024).toFixed(2);
        console.log(`  - ${m.fileName} (${sizeMB} MB)`);
      });
      console.log('');
    }

    // Check users with profile images
    const usersWithImages = await prisma.user.count({
      where: {
        profileImage: {
          not: null,
        },
      },
    });

    console.log('👤 Profile Images:');
    console.log('═'.repeat(80));
    console.log(`  Users with profile images: ${usersWithImages}\n`);

    // Next steps
    if (local.length > 0) {
      console.log('🎯 Next Steps:');
      console.log('  1. Failed materials need manual re-upload via web interface');
      console.log('  2. Or fix the upload issue and run migration again');
      console.log('  3. Check Supabase Storage bucket permissions\n');
    } else {
      console.log('🎉 All files successfully migrated!');
      console.log('  You can now test downloads via the web interface\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStatus();
