import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sechenov.plus' },
    update: {},
    create: {
      email: 'admin@sechenov.plus',
      username: 'admin',
      password: hashedPassword,
      fullName: 'Администратор',
      academicYear: 6,
      status: 'APPROVED',
      role: 'ADMIN',
    },
  });

  console.log('✅ Created admin user:', admin.email);

  // Create subjects (Medical subjects in Russian)
  const subjects = [
    { name: 'Анатомия', slug: 'anatomy', order: 1 },
    { name: 'Гистология', slug: 'histology', order: 2 },
    { name: 'Физиология', slug: 'physiology', order: 3 },
    { name: 'Биохимия', slug: 'biochemistry', order: 4 },
    { name: 'Микробиология', slug: 'microbiology', order: 5 },
    { name: 'Патологическая анатомия', slug: 'pathological-anatomy', order: 6 },
    { name: 'Патологическая физиология', slug: 'pathophysiology', order: 7 },
    { name: 'Фармакология', slug: 'pharmacology', order: 8 },
    { name: 'Внутренние болезни', slug: 'internal-medicine', order: 9 },
    { name: 'Хирургия', slug: 'surgery', order: 10 },
    { name: 'Педиатрия', slug: 'pediatrics', order: 11 },
    { name: 'Акушерство и гинекология', slug: 'obstetrics-gynecology', order: 12 },
    { name: 'Неврология', slug: 'neurology', order: 13 },
    { name: 'Психиатрия', slug: 'psychiatry', order: 14 },
    { name: 'Дерматология', slug: 'dermatology', order: 15 },
    { name: 'Офтальмология', slug: 'ophthalmology', order: 16 },
    { name: 'Оториноларингология', slug: 'otorhinolaryngology', order: 17 },
    { name: 'Стоматология', slug: 'dentistry', order: 18 },
  ];

  for (const subject of subjects) {
    await prisma.subject.upsert({
      where: { slug: subject.slug },
      update: {},
      create: subject,
    });
  }

  console.log(`✅ Created ${subjects.length} subjects`);

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
