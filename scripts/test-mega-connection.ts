/**
 * Test MEGA connection
 */

import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testMega() {
  console.log('🌐 Testing MEGA connection...\n');

  const email = process.env.MEGA_EMAIL;
  const password = process.env.MEGA_PASSWORD;

  if (!email || !password) {
    console.error('❌ MEGA credentials not found in .env.local');
    process.exit(1);
  }

  console.log(`📧 Email: ${email}`);
  console.log('🔑 Password: ***');
  console.log('');

  try {
    console.log('📦 Loading MEGA SDK...');
    const { Storage } = await import('megajs');

    console.log('🔐 Connecting to MEGA...');
    const storage = await new Storage({
      email: email,
      password: password,
    }).ready;

    console.log('✅ Connected successfully!\n');

    // Get storage info
    console.log('📊 MEGA Account Info:');
    console.log(`   Files in root: ${storage.root?.children?.length || 0}`);
    console.log('');

    // Check/create folder
    const folderName = process.env.MEGA_FOLDER_NAME || 'sechenov-plus-materials';
    const existingFolder = storage.root?.children?.find(
      (node: any) => node.name === folderName && node.directory
    );

    if (existingFolder) {
      console.log(`✅ Folder "${folderName}" already exists`);
      console.log(`   Files in folder: ${existingFolder.children?.length || 0}`);
    } else {
      console.log(`📁 Creating folder "${folderName}"...`);
      await storage.mkdir(folderName);
      console.log('✅ Folder created!');
    }

    console.log('\n🎉 MEGA is ready to use!\n');
    console.log('Next steps:');
    console.log('  1. Restart dev server');
    console.log('  2. Upload a material');
    console.log('  3. Check MEGA for the uploaded file\n');

  } catch (error) {
    console.error('❌ MEGA connection failed:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('  1. Check your email and password');
    console.log('  2. Make sure your MEGA account is active');
    console.log('  3. Try logging in at https://mega.nz manually\n');
    process.exit(1);
  }
}

testMega();
