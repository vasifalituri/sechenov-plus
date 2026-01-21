import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText } from 'lucide-react';
import { MaterialsList } from '@/components/materials/MaterialsList';

async function getMaterials() {
  return prisma.material.findMany({
    where: { status: 'APPROVED' },
    include: {
      subject: true,
      uploadedBy: {
        select: { fullName: true, academicYear: true },
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Учебные материалы</h1>
          <p className="text-muted-foreground mt-2">
            Скачивайте и делитесь учебными материалами для подготовки к экзаменам
          </p>
        </div>
        <Link href="/materials/upload">
          <Button>
            <Upload className="w-4 h-4 mr-2" />
            Загрузить материал
          </Button>
        </Link>
      </div>

      {materials.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Материалов пока нет</h3>
            <p className="text-muted-foreground text-center mb-4">
              Будьте первым, кто загрузит полезный материал для студентов
            </p>
            <Link href="/materials/upload">
              <Button>Загрузить материал</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <MaterialsList materials={materials} subjects={subjects} />
      )}
    </div>
  );
}
