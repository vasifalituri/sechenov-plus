// Quick script to check database
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Checking database...');
  
  // Check teachers
  const teachers = await prisma.teacher.findMany();
  console.log(`✓ Teachers: ${teachers.length}`);
  
  // Check if we can create a rating
  try {
    const testRating = await prisma.teacherRating.findFirst();
    console.log('✓ TeacherRating table accessible');
  } catch (e) {
    console.error('✗ TeacherRating error:', e.message);
  }
  
  // Check if we can create a review
  try {
    const testReview = await prisma.teacherReview.findFirst();
    console.log('✓ TeacherReview table accessible');
  } catch (e) {
    console.error('✗ TeacherReview error:', e.message);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
