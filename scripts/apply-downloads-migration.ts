import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function applyMigration() {
  console.log('📊 Applying unique downloads migration...\n');

  try {
    // Check if table exists
    const tableCheck: any[] = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'material_downloads'
      )
    `;

    if (tableCheck[0].exists) {
      console.log('✅ Table material_downloads already exists');
    } else {
      console.log('📝 Creating material_downloads table...');
      
      await prisma.$executeRaw`
        CREATE TABLE "material_downloads" (
            "id" TEXT NOT NULL,
            "materialId" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "material_downloads_pkey" PRIMARY KEY ("id")
        )
      `;

      await prisma.$executeRaw`
        CREATE INDEX "material_downloads_materialId_idx" ON "material_downloads"("materialId")
      `;

      await prisma.$executeRaw`
        CREATE INDEX "material_downloads_userId_idx" ON "material_downloads"("userId")
      `;

      await prisma.$executeRaw`
        CREATE UNIQUE INDEX "material_downloads_materialId_userId_key" ON "material_downloads"("materialId", "userId")
      `;

      await prisma.$executeRaw`
        ALTER TABLE "material_downloads" ADD CONSTRAINT "material_downloads_materialId_fkey" 
        FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE
      `;

      await prisma.$executeRaw`
        ALTER TABLE "material_downloads" ADD CONSTRAINT "material_downloads_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
      `;

      console.log('✅ Table created successfully!');
    }

    console.log('\n✅ Migration complete!');
    console.log('\n🎯 Next: Update download API to track unique downloads');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
