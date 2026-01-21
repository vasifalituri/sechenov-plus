/**
 * Test MEGA connection with your credentials
 * Run: npx ts-node tmp_rovodev_test_mega.ts
 */

async function testMegaConnection() {
  console.log('🔍 Testing MEGA connection...\n');

  // Check environment variables
  const MEGA_EMAIL = process.env.MEGA_EMAIL;
  const MEGA_PASSWORD = process.env.MEGA_PASSWORD;
  const MEGA_FOLDER = process.env.MEGA_FOLDER_NAME || 'sechenov-plus-materials';

  console.log('📧 MEGA_EMAIL:', MEGA_EMAIL ? '✅ Set' : '❌ Not set');
  console.log('🔑 MEGA_PASSWORD:', MEGA_PASSWORD ? '✅ Set' : '❌ Not set');
  console.log('📁 MEGA_FOLDER_NAME:', MEGA_FOLDER, '\n');

  if (!MEGA_EMAIL || !MEGA_PASSWORD) {
    console.error('❌ MEGA credentials not found in environment variables');
    console.log('\n💡 Make sure to set:');
    console.log('   MEGA_EMAIL=your-email@example.com');
    console.log('   MEGA_PASSWORD=your-password');
    process.exit(1);
  }

  try {
    console.log('📦 Importing megajs...');
    const { Storage } = await import('megajs');
    console.log('✅ megajs imported successfully\n');

    console.log('🔌 Connecting to MEGA...');
    const storage = await new Storage({
      email: MEGA_EMAIL,
      password: MEGA_PASSWORD,
    }).ready;

    console.log('✅ Connected to MEGA successfully!\n');

    // List root files/folders
    console.log('📂 Root folders:');
    if (storage.root.children) {
      storage.root.children.forEach((node: any) => {
        const type = node.directory ? '📁' : '📄';
        console.log(`  ${type} ${node.name}`);
      });
    } else {
      console.log('  (Empty or no children loaded)');
    }

    // Check if our folder exists
    console.log(`\n🔍 Looking for folder: "${MEGA_FOLDER}"`);
    const existingFolder = storage.root.children?.find(
      (node: any) => node.name === MEGA_FOLDER && node.directory
    );

    if (existingFolder) {
      console.log(`✅ Folder "${MEGA_FOLDER}" already exists`);
    } else {
      console.log(`⚠️  Folder "${MEGA_FOLDER}" not found`);
      console.log('   (Will be created automatically on first upload)');
    }

    console.log('\n✅ All MEGA tests passed! Your credentials are working correctly.');
    console.log('💡 The upload error might be something else. Check Vercel logs.\n');

  } catch (error) {
    console.error('\n❌ MEGA connection failed!');
    console.error('Error:', error instanceof Error ? error.message : error);
    
    if (error instanceof Error) {
      if (error.message.includes('ELOGIN')) {
        console.log('\n💡 Likely cause: Invalid email or password');
        console.log('   - Check your MEGA email is correct');
        console.log('   - Check your MEGA password is correct');
        console.log('   - Try logging in to https://mega.nz manually to verify');
      } else if (error.message.includes('ETEMPUNAVAIL')) {
        console.log('\n💡 Likely cause: MEGA API is temporarily unavailable');
        console.log('   - Wait a few minutes and try again');
      } else {
        console.log('\n💡 Unknown error. Full details:');
        console.error(error);
      }
    }
    
    process.exit(1);
  }
}

testMegaConnection();
