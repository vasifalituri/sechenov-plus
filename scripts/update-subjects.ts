/**
 * Script to update subjects in the database
 * Run: npx ts-node scripts/update-subjects.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateSubjects() {
  console.log('🔄 Updating subjects in database...\n');

  // New subjects list (alphabetically sorted with "Другое" first)
  const newSubjects = [
    { name: 'Другое', slug: 'other', order: 1 },
    { name: 'Акушерство', slug: 'obstetrics', order: 2 },
    { name: 'Анатомия', slug: 'anatomy', order: 3 },
    { name: 'Анестезиология, реаниматология', slug: 'anesthesiology-reanimatology', order: 4 },
    { name: 'Биоэтика', slug: 'bioethics', order: 5 },
    { name: 'Биохимия', slug: 'biochemistry', order: 6 },
    { name: 'Генетика', slug: 'genetics', order: 7 },
    { name: 'Гигиена', slug: 'hygiene', order: 8 },
    { name: 'Гинекология', slug: 'gynecology', order: 9 },
    { name: 'Госпитальная терапия', slug: 'hospital-therapy', order: 10 },
    { name: 'Дерматовенерология', slug: 'dermatovenereology', order: 11 },
    { name: 'Доказательная медицина: принципы и методология', slug: 'evidence-based-medicine', order: 12 },
    { name: 'Инфекционные болезни', slug: 'infectious-diseases', order: 13 },
    { name: 'Информационные технологии', slug: 'information-technologies', order: 14 },
    { name: 'Клиническая патофизиология', slug: 'clinical-pathophysiology', order: 15 },
    { name: 'Клиническая практика "Акушерско-гинекологическая"', slug: 'clinical-practice-obstetric-gynecological', order: 16 },
    { name: 'Латинский язык', slug: 'latin', order: 17 },
    { name: 'Лучевая диагностика', slug: 'radiation-diagnostics', order: 18 },
    { name: 'Медицинская генетика', slug: 'medical-genetics', order: 19 },
    { name: 'Медицинская реабилитология', slug: 'medical-rehabilitation', order: 20 },
    { name: 'Медицинская эмбриология', slug: 'medical-embryology', order: 21 },
    { name: 'Микробиология', slug: 'microbiology', order: 22 },
    { name: 'Неврология, нейрохирургия', slug: 'neurology-neurosurgery', order: 23 },
    { name: 'Нормальная физиология', slug: 'normal-physiology', order: 24 },
    { name: 'Общая хирургия', slug: 'general-surgery', order: 25 },
    { name: 'Общественное здоровье и здравоохранение', slug: 'public-health', order: 26 },
    { name: 'Офтальмология', slug: 'ophthalmology', order: 27 },
    { name: 'Оториноларингология', slug: 'otorhinolaryngology', order: 28 },
    { name: 'Патологическая анатомия', slug: 'pathological-anatomy', order: 29 },
    { name: 'Патофизиология', slug: 'pathophysiology', order: 30 },
    { name: 'Педиатрия, неонатология', slug: 'pediatrics-neonatology', order: 31 },
    { name: 'Первая помощь и уход за больными', slug: 'first-aid-patient-care', order: 32 },
    { name: 'Практика по получению первичных навыков научно-исследовательской работы', slug: 'practice-research-skills', order: 33 },
    { name: 'Практика по получению первичных профессиональных умений и навыков "Уход за больными"', slug: 'practice-patient-care', order: 34 },
    { name: 'Практика по получению профессиональных умений и опыта профессиональной деятельности "Общеврачебная"', slug: 'practice-general-medical', order: 35 },
    { name: 'Пропедевтика внутренних болезней', slug: 'propaedeutics-internal-diseases', order: 36 },
    { name: 'Психиатрия, медицинская психология', slug: 'psychiatry-medical-psychology', order: 37 },
    { name: 'Сестринское дело', slug: 'nursing', order: 38 },
    { name: 'Судебная медицина', slug: 'forensic-medicine', order: 39 },
    { name: 'Топографическая анатомия и оперативная хирургия', slug: 'topographic-anatomy-operative-surgery', order: 40 },
    { name: 'Травматология, ортопедия', slug: 'traumatology-orthopedics', order: 41 },
    { name: 'Урология', slug: 'urology', order: 42 },
    { name: 'Устная профессиональная коммуникация на иностранном языке', slug: 'professional-communication-foreign-language', order: 43 },
    { name: 'Факультетская терапия', slug: 'faculty-therapy', order: 44 },
    { name: 'Факультетская хирургия', slug: 'faculty-surgery', order: 45 },
    { name: 'Фармакология', slug: 'pharmacology', order: 46 },
    { name: 'Фтизиатрия и пульмонология', slug: 'phthisiatry-pulmonology', order: 47 },
    { name: 'Челюстно-лицевая хирургия', slug: 'maxillofacial-surgery', order: 48 },
    { name: 'Экономика и право', slug: 'economics-law', order: 49 },
    { name: 'Эндокринология', slug: 'endocrinology', order: 50 },
  ];

  // Get existing subjects
  const existingSubjects = await prisma.subject.findMany();
  console.log(`📊 Found ${existingSubjects.length} existing subjects`);

  // Delete old subjects that are not in the new list
  const newSlugs = newSubjects.map(s => s.slug);
  const toDelete = existingSubjects.filter(s => !newSlugs.includes(s.slug));
  
  if (toDelete.length > 0) {
    console.log(`\n🗑️  Deleting ${toDelete.length} old subjects:`);
    for (const subject of toDelete) {
      console.log(`   - ${subject.name}`);
      await prisma.subject.delete({ where: { id: subject.id } });
    }
  }

  // Create or update subjects
  console.log(`\n✅ Creating/updating ${newSubjects.length} subjects:`);
  let created = 0;
  let updated = 0;

  for (const subject of newSubjects) {
    const existing = existingSubjects.find(s => s.slug === subject.slug);
    
    if (existing) {
      // Update existing
      await prisma.subject.update({
        where: { id: existing.id },
        data: {
          name: subject.name,
          order: subject.order,
        },
      });
      console.log(`   ✏️  Updated: ${subject.name}`);
      updated++;
    } else {
      // Create new
      await prisma.subject.create({
        data: subject,
      });
      console.log(`   ➕ Created: ${subject.name}`);
      created++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ➕ Created: ${created}`);
  console.log(`   ✏️  Updated: ${updated}`);
  console.log(`   🗑️  Deleted: ${toDelete.length}`);
  console.log(`\n🎉 Subjects updated successfully!`);
}

updateSubjects()
  .catch((e) => {
    console.error('❌ Error updating subjects:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
