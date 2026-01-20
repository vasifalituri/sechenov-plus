import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/ui/star-rating';
import { Upload, Download, FileText } from 'lucide-react';
import { formatDate, formatFileSize } from '@/lib/utils';

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
  const materials = await getMaterials();
  const subjects = await getSubjects();

  // Group materials by academic year
  const materialsByYear = materials.reduce((acc, material) => {
    if (!acc[material.academicYear]) {
      acc[material.academicYear] = [];
    }
    acc[material.academicYear].push(material);
    return acc;
  }, {} as Record<number, typeof materials>);

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
        <div className="space-y-8">
          {[1, 2, 3, 4, 5, 6].map((year) => {
            const yearMaterials = materialsByYear[year] || [];
            if (yearMaterials.length === 0) return null;

            return (
              <div key={year}>
                <h2 className="text-2xl font-bold mb-4">{year} курс</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {yearMaterials.map((material) => (
                    <Card key={material.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <Badge variant="secondary">{material.subject.name}</Badge>
                          <Badge variant="outline">{material.fileType}</Badge>
                        </div>
                        <CardTitle className="text-lg mt-2">{material.title}</CardTitle>
                        <CardDescription>
                          {material.description || 'Без описания'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {material.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {material.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          {/* Rating */}
                          <div className="pb-3 border-b">
                            <StarRating materialId={material.id} size="sm" readonly />
                          </div>

                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>Загрузил: {material.uploadedBy.fullName}</p>
                            <p>Размер: {formatFileSize(material.fileSize)}</p>
                            <p>Дата: {formatDate(material.createdAt)}</p>
                            <p>Скачиваний: {material.downloadCount}</p>
                          </div>

                          <Link href={`/materials/${material.id}`}>
                            <Button className="w-full" size="sm">
                              <FileText className="w-4 h-4 mr-2" />
                              Подробнее
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
