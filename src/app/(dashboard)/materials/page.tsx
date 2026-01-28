import { prisma } from '@/lib/prisma';
import { MaterialsPageClient } from '@/components/materials/MaterialsPageClient';

async function getMaterials() {
  return prisma.material.findMany({
    where: { status: 'APPROVED' },
    include: {
      subject: true,
      uploadedBy: {
        select: { 
          id: true,
          username: true,
          fullName: true, 
          academicYear: true,
          role: true,
        },
      },
      ratings: {
        select: { rating: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function getSubjects() {
  return prisma.subject.findMany({
    orderBy: { order: 'asc' },
  });
}

export default async function MaterialsPage() {
  const [materials, subjects] = await Promise.all([
    getMaterials(),
    getSubjects(),
  ]);

  return <MaterialsPageClient initialMaterials={materials} subjects={subjects} />;
}
