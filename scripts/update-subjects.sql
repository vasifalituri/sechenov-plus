-- SQL Script to update subjects in production database
-- Execute this in Neon SQL Editor or any PostgreSQL client

-- Step 1: Delete old subjects that are not in the new list
DELETE FROM "Subject" WHERE slug NOT IN (
  'other', 'obstetrics', 'anatomy', 'anesthesiology-reanimatology', 'bioethics',
  'biochemistry', 'genetics', 'hygiene', 'gynecology', 'hospital-therapy',
  'dermatovenereology', 'evidence-based-medicine', 'infectious-diseases',
  'information-technologies', 'clinical-pathophysiology',
  'clinical-practice-obstetric-gynecological', 'latin', 'radiation-diagnostics',
  'medical-genetics', 'medical-rehabilitation', 'medical-embryology',
  'microbiology', 'neurology-neurosurgery', 'normal-physiology',
  'general-surgery', 'public-health', 'ophthalmology', 'otorhinolaryngology',
  'pathological-anatomy', 'pathophysiology', 'pediatrics-neonatology',
  'first-aid-patient-care', 'practice-research-skills', 'practice-patient-care',
  'practice-general-medical', 'propaedeutics-internal-diseases',
  'psychiatry-medical-psychology', 'nursing', 'forensic-medicine',
  'topographic-anatomy-operative-surgery', 'traumatology-orthopedics',
  'urology', 'professional-communication-foreign-language', 'faculty-therapy',
  'faculty-surgery', 'pharmacology', 'phthisiatry-pulmonology',
  'maxillofacial-surgery', 'economics-law', 'endocrinology'
);

-- Step 2: Insert or update subjects (UPSERT)
INSERT INTO "Subject" (id, name, slug, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), 'Другое', 'other', 1, NOW(), NOW()),
  (gen_random_uuid(), 'Акушерство', 'obstetrics', 2, NOW(), NOW()),
  (gen_random_uuid(), 'Анатомия', 'anatomy', 3, NOW(), NOW()),
  (gen_random_uuid(), 'Анестезиология, реаниматология', 'anesthesiology-reanimatology', 4, NOW(), NOW()),
  (gen_random_uuid(), 'Биоэтика', 'bioethics', 5, NOW(), NOW()),
  (gen_random_uuid(), 'Биохимия', 'biochemistry', 6, NOW(), NOW()),
  (gen_random_uuid(), 'Генетика', 'genetics', 7, NOW(), NOW()),
  (gen_random_uuid(), 'Гигиена', 'hygiene', 8, NOW(), NOW()),
  (gen_random_uuid(), 'Гинекология', 'gynecology', 9, NOW(), NOW()),
  (gen_random_uuid(), 'Госпитальная терапия', 'hospital-therapy', 10, NOW(), NOW()),
  (gen_random_uuid(), 'Дерматовенерология', 'dermatovenereology', 11, NOW(), NOW()),
  (gen_random_uuid(), 'Доказательная медицина: принципы и методология', 'evidence-based-medicine', 12, NOW(), NOW()),
  (gen_random_uuid(), 'Инфекционные болезни', 'infectious-diseases', 13, NOW(), NOW()),
  (gen_random_uuid(), 'Информационные технологии', 'information-technologies', 14, NOW(), NOW()),
  (gen_random_uuid(), 'Клиническая патофизиология', 'clinical-pathophysiology', 15, NOW(), NOW()),
  (gen_random_uuid(), 'Клиническая практика "Акушерско-гинекологическая"', 'clinical-practice-obstetric-gynecological', 16, NOW(), NOW()),
  (gen_random_uuid(), 'Латинский язык', 'latin', 17, NOW(), NOW()),
  (gen_random_uuid(), 'Лучевая диагностика', 'radiation-diagnostics', 18, NOW(), NOW()),
  (gen_random_uuid(), 'Медицинская генетика', 'medical-genetics', 19, NOW(), NOW()),
  (gen_random_uuid(), 'Медицинская реабилитология', 'medical-rehabilitation', 20, NOW(), NOW()),
  (gen_random_uuid(), 'Медицинская эмбриология', 'medical-embryology', 21, NOW(), NOW()),
  (gen_random_uuid(), 'Микробиология', 'microbiology', 22, NOW(), NOW()),
  (gen_random_uuid(), 'Неврология, нейрохирургия', 'neurology-neurosurgery', 23, NOW(), NOW()),
  (gen_random_uuid(), 'Нормальная физиология', 'normal-physiology', 24, NOW(), NOW()),
  (gen_random_uuid(), 'Общая хирургия', 'general-surgery', 25, NOW(), NOW()),
  (gen_random_uuid(), 'Общественное здоровье и здравоохранение', 'public-health', 26, NOW(), NOW()),
  (gen_random_uuid(), 'Офтальмология', 'ophthalmology', 27, NOW(), NOW()),
  (gen_random_uuid(), 'Оториноларингология', 'otorhinolaryngology', 28, NOW(), NOW()),
  (gen_random_uuid(), 'Патологическая анатомия', 'pathological-anatomy', 29, NOW(), NOW()),
  (gen_random_uuid(), 'Патофизиология', 'pathophysiology', 30, NOW(), NOW()),
  (gen_random_uuid(), 'Педиатрия, неонатология', 'pediatrics-neonatology', 31, NOW(), NOW()),
  (gen_random_uuid(), 'Первая помощь и уход за больными', 'first-aid-patient-care', 32, NOW(), NOW()),
  (gen_random_uuid(), 'Практика по получению первичных навыков научно-исследовательской работы', 'practice-research-skills', 33, NOW(), NOW()),
  (gen_random_uuid(), 'Практика по получению первичных профессиональных умений и навыков "Уход за больными"', 'practice-patient-care', 34, NOW(), NOW()),
  (gen_random_uuid(), 'Практика по получению профессиональных умений и опыта профессиональной деятельности "Общеврачебная"', 'practice-general-medical', 35, NOW(), NOW()),
  (gen_random_uuid(), 'Пропедевтика внутренних болезней', 'propaedeutics-internal-diseases', 36, NOW(), NOW()),
  (gen_random_uuid(), 'Психиатрия, медицинская психология', 'psychiatry-medical-psychology', 37, NOW(), NOW()),
  (gen_random_uuid(), 'Сестринское дело', 'nursing', 38, NOW(), NOW()),
  (gen_random_uuid(), 'Судебная медицина', 'forensic-medicine', 39, NOW(), NOW()),
  (gen_random_uuid(), 'Топографическая анатомия и оперативная хирургия', 'topographic-anatomy-operative-surgery', 40, NOW(), NOW()),
  (gen_random_uuid(), 'Травматология, ортопедия', 'traumatology-orthopedics', 41, NOW(), NOW()),
  (gen_random_uuid(), 'Урология', 'urology', 42, NOW(), NOW()),
  (gen_random_uuid(), 'Устная профессиональная коммуникация на иностранном языке', 'professional-communication-foreign-language', 43, NOW(), NOW()),
  (gen_random_uuid(), 'Факультетская терапия', 'faculty-therapy', 44, NOW(), NOW()),
  (gen_random_uuid(), 'Факультетская хирургия', 'faculty-surgery', 45, NOW(), NOW()),
  (gen_random_uuid(), 'Фармакология', 'pharmacology', 46, NOW(), NOW()),
  (gen_random_uuid(), 'Фтизиатрия и пульмонология', 'phthisiatry-pulmonology', 47, NOW(), NOW()),
  (gen_random_uuid(), 'Челюстно-лицевая хирургия', 'maxillofacial-surgery', 48, NOW(), NOW()),
  (gen_random_uuid(), 'Экономика и право', 'economics-law', 49, NOW(), NOW()),
  (gen_random_uuid(), 'Эндокринология', 'endocrinology', 50, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  "order" = EXCLUDED."order",
  "updatedAt" = NOW();

-- Step 3: Verify the update
SELECT COUNT(*) as total_subjects FROM "Subject";
SELECT name, slug, "order" FROM "Subject" ORDER BY "order" LIMIT 10;
