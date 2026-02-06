const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const reviewId = process.argv[2];
  
  if (!reviewId) {
    console.log('Использование: node approve-review.js <reviewId>');
    return;
  }
  
  const review = await prisma.teacherReview.update({
    where: { id: reviewId },
    data: { status: 'APPROVED' }
  });
  
  console.log(`✅ Отзыв одобрен!`);
  console.log(`ID: ${review.id}`);
  console.log(`Статус: ${review.status}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
