import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkQuestions() {
  try {
    console.log('Checking database...\n');
    
    // Check subjects
    const subjects = await prisma.subject.findMany({
      include: {
        _count: {
          select: {
            quizQuestions: true,
            quizBlocks: true
          }
        }
      }
    });
    
    console.log('📚 Subjects:');
    subjects.forEach(s => {
      console.log(`  - ${s.name} (${s.slug})`);
      console.log(`    ID: ${s.id}`);
      console.log(`    Questions: ${s._count.quizQuestions}`);
      console.log(`    Blocks: ${s._count.quizBlocks}`);
    });
    
    // Check questions for Gynecology
    const gynSubject = subjects.find(s => s.slug === 'gynecology');
    
    if (gynSubject) {
      console.log(`\n🔍 Checking questions for ${gynSubject.name}:`);
      
      const questions = await prisma.quizQuestion.findMany({
        where: {
          subjectId: gynSubject.id,
          isActive: true
        },
        take: 5
      });
      
      console.log(`  Found ${questions.length} active questions`);
      console.log(`  First question:`, questions[0] ? questions[0].questionText : 'No questions');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkQuestions();
