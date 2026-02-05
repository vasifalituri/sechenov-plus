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

  // Create subjects (Medical subjects in Russian - alphabetically sorted with "Другое" first)
  const subjects = [
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

  for (const subject of subjects) {
    await prisma.subject.upsert({
      where: { slug: subject.slug },
      update: {},
      create: subject,
    });
  }

  console.log(`✅ Created ${subjects.length} subjects`);

  // Create sample teachers
  const anatomySubject = await prisma.subject.findUnique({ where: { slug: 'anatomy' } });
  const physiologySubject = await prisma.subject.findUnique({ where: { slug: 'normal-physiology' } });
  const biochemistrySubject = await prisma.subject.findUnique({ where: { slug: 'biochemistry' } });
  const pharmacologySubject = await prisma.subject.findUnique({ where: { slug: 'pharmacology' } });
  const surgerySubject = await prisma.subject.findUnique({ where: { slug: 'general-surgery' } });

  const teachers = [
    {
      fullName: 'Иванов Иван Иванович',
      department: 'Анатомия',
      position: 'Профессор',
      academicDegree: 'д.м.н.',
      bio: 'Заведующий кафедрой анатомии человека. Автор более 100 научных публикаций. Специализируется на нейроанатомии и клинической анатомии.',
      subjects: anatomySubject ? [anatomySubject.id] : [],
    },
    {
      fullName: 'Петрова Мария Александровна',
      department: 'Физиология',
      position: 'Доцент',
      academicDegree: 'к.м.н.',
      bio: 'Доцент кафедры нормальной физиологии. Ведет исследования в области нейрофизиологии и физиологии высшей нервной деятельности.',
      subjects: physiologySubject ? [physiologySubject.id] : [],
    },
    {
      fullName: 'Сидоров Петр Николаевич',
      department: 'Биохимия',
      position: 'Профессор',
      academicDegree: 'д.б.н.',
      bio: 'Профессор кафедры биохимии. Эксперт в области клинической биохимии и молекулярной диагностики. Лауреат государственных премий.',
      subjects: biochemistrySubject ? [biochemistrySubject.id] : [],
    },
    {
      fullName: 'Алиева Айгуль Рашидовна',
      department: 'Фармакология',
      position: 'Доцент',
      academicDegree: 'к.м.н.',
      bio: 'Доцент кафедры фармакологии. Специализируется на клинической фармакологии и фармакотерапии. Автор учебных пособий.',
      subjects: pharmacologySubject ? [pharmacologySubject.id] : [],
    },
    {
      fullName: 'Ковалев Дмитрий Сергеевич',
      department: 'Хирургия',
      position: 'Профессор',
      academicDegree: 'д.м.н.',
      bio: 'Заведующий кафедрой общей хирургии. Практикующий хирург с 25-летним стажем. Специализация: абдоминальная хирургия.',
      subjects: surgerySubject ? [surgerySubject.id] : [],
    },
    {
      fullName: 'Мамедова Лейла Ахмедовна',
      department: 'Анатомия',
      position: 'Ассистент',
      academicDegree: 'к.м.н.',
      bio: 'Ассистент кафедры анатомии человека. Молодой перспективный преподаватель, активно участвует в научных конференциях.',
      subjects: anatomySubject ? [anatomySubject.id] : [],
    },
  ];

  for (const teacher of teachers) {
    const subjectIds = teacher.subjects;
    const createdTeacher = await prisma.teacher.create({
      data: {
        fullName: teacher.fullName,
        department: teacher.department,
        position: teacher.position,
        academicDegree: teacher.academicDegree,
        bio: teacher.bio,
        isActive: true,
        subjects: {
          create: subjectIds.map((subjectId) => ({
            subjectId,
          })),
        },
      },
    });
    console.log(`✅ Created teacher: ${createdTeacher.fullName}`);
  }

  console.log(`✅ Created ${teachers.length} sample teachers`);

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
