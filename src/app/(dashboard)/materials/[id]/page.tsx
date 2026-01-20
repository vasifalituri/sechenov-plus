import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookmarkButton } from '@/components/ui/bookmark-button';
import { StarRating } from '@/components/ui/star-rating';
import { Download, FileText, ArrowLeft } from 'lucide-react';
import { formatDate, formatFileSize } from '@/lib/utils';

async function getMaterial(id: string) {
  return prisma.material.findUnique({
    where: { id },
    include: {
      subject: true,
      uploadedBy: {
        select: {
          fullName: true,
          academicYear: true,
        },
      },
    },
  });
}

export default async function MaterialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const material = await getMaterial(id);

  if (!material || material.status !== 'APPROVED') {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" suppressHydrationWarning>
      <Link href="/materials">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад к материалам
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between" suppressHydrationWarning>
            <div className="space-y-2" suppressHydrationWarning>
              <div className="flex items-center gap-2" suppressHydrationWarning>
                <Badge variant="secondary">{material.subject.name}</Badge>
                <Badge variant="outline">{material.academicYear} курс</Badge>
                <Badge variant="outline">{material.fileType}</Badge>
              </div>
              <CardTitle className="text-3xl">{material.title}</CardTitle>
              <CardDescription className="text-base">
                {material.description || 'Без описания'}
              </CardDescription>
            </div>
            <FileText className="w-12 h-12 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6" suppressHydrationWarning>
          {material.tags.length > 0 && (
            <div suppressHydrationWarning>
              <h3 className="font-medium mb-2">Теги</h3>
              <div className="flex flex-wrap gap-2" suppressHydrationWarning>
                {material.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 py-4 border-y" suppressHydrationWarning>
            <div suppressHydrationWarning>
              <p className="text-sm text-muted-foreground">Загрузил</p>
              <p className="font-medium">{material.uploadedBy.fullName}</p>
              <p className="text-sm text-muted-foreground">
                {material.uploadedBy.academicYear} курс
              </p>
            </div>
            <div suppressHydrationWarning>
              <p className="text-sm text-muted-foreground">Дата загрузки</p>
              <p className="font-medium">{formatDate(material.createdAt)}</p>
            </div>
            <div suppressHydrationWarning>
              <p className="text-sm text-muted-foreground">Размер файла</p>
              <p className="font-medium">{formatFileSize(material.fileSize)}</p>
            </div>
            <div suppressHydrationWarning>
              <p className="text-sm text-muted-foreground">Скачиваний</p>
              <p className="font-medium">{material.downloadCount}</p>
            </div>
          </div>

          {/* Rating Section */}
          <div className="py-4 border-y" suppressHydrationWarning>
            <h3 className="text-sm font-semibold mb-3">Оценка материала</h3>
            <StarRating materialId={material.id} size="lg" />
          </div>

          <div className="space-y-3" suppressHydrationWarning>
            <div className="flex gap-3" suppressHydrationWarning>
              <a
                href={`/api/materials/download/${material.id}`}
                download
                className="flex-1"
              >
                <Button size="lg" className="w-full">
                  <Download className="w-5 h-5 mr-2" />
                  Скачать материал
                </Button>
              </a>
              <BookmarkButton
                type="MATERIAL"
                itemId={material.id}
                size="lg"
                variant="outline"
                showLabel
              />
            </div>
            
            {material.fileType === 'PDF' && material.storageType !== 'EXTERNAL_MEGA' && (
              <div className="border rounded-lg p-4" suppressHydrationWarning>
                <p className="text-sm text-muted-foreground mb-2">Предпросмотр PDF</p>
                <iframe
                  src={`/api/materials/download/${material.id}`}
                  className="w-full h-[600px] border rounded"
                  title={material.title}
                />
              </div>
            )}
            
            {material.fileType === 'PDF' && material.storageType === 'EXTERNAL_MEGA' && (
              <div className="border rounded-lg p-4 bg-yellow-50">
                <p className="text-sm text-yellow-800 mb-2">
                  ℹ️ Предпросмотр недоступен для файлов из внешнего хранилища. 
                  Пожалуйста, скачайте файл для просмотра.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
