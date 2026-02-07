import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface QuestionData {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  correctAnswer: string;
  questionType: 'SINGLE' | 'MULTIPLE';
}

async function importGynecologyQuestions() {
  try {
    console.log('🚀 Starting gynecology questions import...\n');

    // Read JSON file
    const jsonPath = path.join(__dirname, '../tmp_rovodev_gynecology_final.json');
    const questionsData: QuestionData[] = JSON.parse(
      fs.readFileSync(jsonPath, 'utf8')
    );

    console.log(`📄 Loaded ${questionsData.length} questions from JSON\n`);

    // Find or create Gynecology subject
    let gynecologySubject = await prisma.subject.findFirst({
      where: {
        OR: [
          { slug: 'gynecology' },
          { slug: 'ginekologiya' },
          { name: { contains: 'Гинекология', mode: 'insensitive' } }
        ]
      }
    });

    if (!gynecologySubject) {
      console.log('📝 Creating Gynecology subject...');
      gynecologySubject = await prisma.subject.create({
        data: {
          name: 'Гинекология',
          slug: 'gynecology',
          description: 'Акушерство и гинекология',
          order: 10
        }
      });
      console.log(`✅ Subject created: ${gynecologySubject.name} (${gynecologySubject.id})\n`);
    } else {
      console.log(`✅ Found existing subject: ${gynecologySubject.name} (${gynecologySubject.id})\n`);
    }

    // Create or find quiz block
    let quizBlock = await prisma.quizBlock.findFirst({
      where: {
        subjectId: gynecologySubject.id,
        title: 'Гинекология - Полный курс'
      }
    });

    if (!quizBlock) {
      console.log('📝 Creating quiz block...');
      quizBlock = await prisma.quizBlock.create({
        data: {
          title: 'Гинекология - Полный курс',
          description: 'Все вопросы по гинекологии для подготовки к ЦТ',
          subjectId: gynecologySubject.id,
          questionCount: questionsData.length,
          difficulty: 'MEDIUM',
          isActive: true,
          orderIndex: 1
        }
      });
      console.log(`✅ Quiz block created: ${quizBlock.title} (${quizBlock.id})\n`);
    } else {
      console.log(`✅ Found existing quiz block: ${quizBlock.title} (${quizBlock.id})\n`);
    }

    // Import questions
    console.log('📝 Importing questions...\n');
    
    let imported = 0;
    let skipped = 0;

    for (const questionData of questionsData) {
      try {
        // Check if question already exists
        const existing = await prisma.quizQuestion.findFirst({
          where: {
            questionText: questionData.question,
            subjectId: gynecologySubject.id
          }
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Create question
        await prisma.quizQuestion.create({
          data: {
            blockId: quizBlock.id,
            subjectId: gynecologySubject.id,
            questionText: questionData.question,
            optionA: questionData.optionA,
            optionB: questionData.optionB,
            optionC: questionData.optionC,
            optionD: questionData.optionD,
            optionE: questionData.optionE || null,
            correctAnswer: questionData.correctAnswer,
            questionType: questionData.questionType,
            difficulty: 'MEDIUM',
            isActive: true,
            tags: ['gynecology', 'ct-exam']
          }
        });

        imported++;

        if (imported % 50 === 0) {
          console.log(`   ✓ Imported ${imported} questions...`);
        }
      } catch (error) {
        console.error(`   ❌ Error importing question: ${questionData.question.substring(0, 50)}...`);
        console.error(`      ${error}`);
      }
    }

    console.log(`\n✅ Import completed!`);
    console.log(`   - Imported: ${imported} questions`);
    console.log(`   - Skipped (duplicates): ${skipped} questions`);
    console.log(`   - Total: ${questionsData.length} questions\n`);

    // Update block question count
    await prisma.quizBlock.update({
      where: { id: quizBlock.id },
      data: {
        questionCount: imported + skipped
      }
    });

    console.log('🎉 All done!\n');

  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importGynecologyQuestions()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
