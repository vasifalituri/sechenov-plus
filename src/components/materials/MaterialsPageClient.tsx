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
    id: string;
    username: string | null;
    fullName: string;
    academicYear: number;
    role?: 'USER' | 'MODERATOR' | 'ADMIN';
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
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold">Учебные материалы</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
              Скачивайте и делитесь учебными материалами для подготовки к экзаменам
            </p>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <span className="text-xs text-muted-foreground">
              {lastUpdated.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Обновить список"
              className="flex-shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Link href="/materials/upload" className="flex-shrink-0">
              <Button size="sm" className="w-full sm:w-auto">
                <Upload className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Загрузить материал</span>
              </Button>
            </Link>
          </div>
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
