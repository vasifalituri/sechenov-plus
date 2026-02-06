const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const reviews = await prisma.teacherReview.findMany({
    include: {
      teacher: { select: { fullName: true } },
      user: { select: { fullName: true } }
    }
  });
  
  console.log(`\nВсего отзывов: ${reviews.length}\n`);
  
  reviews.forEach(review => {
    console.log(`ID: ${review.id}`);
    console.log(`Преподаватель: ${review.teacher.fullName}`);
    console.log(`От: ${review.isAnonymous ? 'Анонимно' : review.user.fullName}`);
    console.log(`Статус: ${review.status}`);
    console.log(`Текст: ${review.content.substring(0, 50)}...`);
    console.log('---\n');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
