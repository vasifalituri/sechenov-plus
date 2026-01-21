'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, RefreshCw } from 'lucide-react';
import { MaterialsList } from '@/components/materials/MaterialsList';
import type { Subject } from '@/types/models';

interface Material {
  id: string;
  title: string;
  description: string | null;
  academicYear: number;
  fileType: string;
  fileSize: number;
  fileName: string;
  tags: string[];
  downloadCount: number;
  createdAt: Date | string;
  subject: Subject;
  uploadedBy: {
    fullName: string;
    academicYear: number;
  };
  ratings: {
    rating: number;
  }[];
}

interface MaterialsPageClientProps {
  initialMaterials: Material[];
  subjects: Subject[];
}

export function MaterialsPageClient({ initialMaterials, subjects }: MaterialsPageClientProps) {
  const [materials, setMaterials] = useState(initialMaterials);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/materials');
      const data = await response.json();
      if (data.success) {
        setMaterials(data.data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error refreshing materials:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Учебные материалы</h1>
          <p className="text-muted-foreground mt-2">
            Скачивайте и делитесь учебными материалами для подготовки к экзаменам
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Обновлено: {lastUpdated.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Обновить список"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Link href="/materials/upload">
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Загрузить материал
            </Button>
          </Link>
        </div>
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
