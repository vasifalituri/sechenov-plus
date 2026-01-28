'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/ui/star-rating';
import { FileText } from 'lucide-react';
import { formatDate, formatFileSize } from '@/lib/utils';
import { MaterialFilters } from './MaterialFilters';
import type { Subject } from '@/types/models';
import { getStaffBadge, getStaffColorClass } from '@/lib/permissions';

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

interface MaterialsListProps {
  materials: Material[];
  subjects: Subject[];
}

export function MaterialsList({ materials, subjects }: MaterialsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Extract all unique tags from materials
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    materials.forEach((material) => {
      material.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [materials]);

  // Filter materials based on all criteria
  const filteredMaterials = useMemo(() => {
    return materials.filter((material) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = material.title.toLowerCase().includes(query);
        const matchesDescription = material.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDescription) return false;
      }

      // Subject filter
      if (selectedSubject && material.subject.id !== selectedSubject) {
        return false;
      }

      // Year filter
      if (selectedYear !== null && material.academicYear !== selectedYear) {
        return false;
      }

      // Tag filter
      if (selectedTag && !material.tags.includes(selectedTag)) {
        return false;
      }

      return true;
    });
  }, [materials, searchQuery, selectedSubject, selectedYear, selectedTag]);

  // Group filtered materials by academic year
  const materialsByYear = useMemo(() => {
    return filteredMaterials.reduce((acc, material) => {
      if (!acc[material.academicYear]) {
        acc[material.academicYear] = [];
      }
      acc[material.academicYear].push(material);
      return acc;
    }, {} as Record<number, Material[]>);
  }, [filteredMaterials]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedSubject(null);
    setSelectedYear(null);
    setSelectedTag(null);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <MaterialFilters
        searchQuery={searchQuery}
        selectedSubject={selectedSubject}
        selectedYear={selectedYear}
        selectedTag={selectedTag}
        subjects={subjects}
        availableTags={availableTags}
        onSearchChange={setSearchQuery}
        onSubjectChange={setSelectedSubject}
        onYearChange={setSelectedYear}
        onTagChange={setSelectedTag}
        onClearFilters={handleClearFilters}
      />

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Найдено материалов: <span className="font-semibold">{filteredMaterials.length}</span> из {materials.length}
        </p>
      </div>

      {/* Materials grid by year */}
      {filteredMaterials.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Материалов не найдено</h3>
            <p className="text-muted-foreground text-center mb-4">
              Попробуйте изменить параметры поиска или сбросить фильтры
            </p>
            <Button onClick={handleClearFilters} variant="outline">
              Сбросить фильтры
            </Button>
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
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="text-xs cursor-pointer hover:bg-primary/10"
                                  onClick={() => setSelectedTag(tag)}
                                >
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
                            <p className="flex items-center gap-1">
                              Загрузил:{' '}
                              {material.uploadedBy.username ? (
                                <Link href={`/users/${material.uploadedBy.username}`} className="flex items-center gap-1">
                                  {getStaffBadge(material.uploadedBy.role) && (
                                    <span className="text-xs" title={getStaffBadge(material.uploadedBy.role)?.label}>
                                      {getStaffBadge(material.uploadedBy.role)?.icon}
                                    </span>
                                  )}
                                  <span className={`hover:underline cursor-pointer font-medium ${getStaffColorClass(material.uploadedBy.role) || 'text-blue-600 dark:text-blue-400'}`}>
                                    @{material.uploadedBy.username}
                                  </span>
                                </Link>
                              ) : (
                                <span>{material.uploadedBy.fullName}</span>
                              )}
                            </p>
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
