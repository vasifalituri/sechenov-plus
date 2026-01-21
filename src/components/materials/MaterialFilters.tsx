'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SubjectSelect } from '@/components/ui/subject-select';
import { Search, X } from 'lucide-react';
import type { Subject } from '@/types/models';

interface MaterialFiltersProps {
  searchQuery: string;
  selectedSubject: string | null;
  selectedYear: number | null;
  selectedTag: string | null;
  subjects: Subject[];
  availableTags: string[];
  onSearchChange: (query: string) => void;
  onSubjectChange: (subjectId: string | null) => void;
  onYearChange: (year: number | null) => void;
  onTagChange: (tag: string | null) => void;
  onClearFilters: () => void;
}

const academicYears = [1, 2, 3, 4, 5, 6];

export const MaterialFilters = memo(function MaterialFilters({
  searchQuery,
  selectedSubject,
  selectedYear,
  selectedTag,
  subjects,
  availableTags,
  onSearchChange,
  onSubjectChange,
  onYearChange,
  onTagChange,
  onClearFilters,
}: MaterialFiltersProps) {
  // Add "Все" option to subjects
  const subjectsWithAll = [
    { id: '', name: 'Все предметы', slug: 'all', order: 0 },
    ...subjects,
  ];

  const hasActiveFilters = searchQuery || selectedSubject || selectedYear || selectedTag;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Search input */}
          <div>
            <h3 className="text-sm font-medium mb-2">Поиск</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Поиск по названию или описанию..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Subject filter */}
          <div>
            <h3 className="text-sm font-medium mb-2">Предмет</h3>
            <SubjectSelect
              value={selectedSubject || ''}
              onChange={(value) => onSubjectChange(value === '' ? null : value)}
              subjects={subjectsWithAll}
              placeholder="Выберите предмет..."
            />
          </div>

          {/* Academic Year filter */}
          <div>
            <h3 className="text-sm font-medium mb-2">Курс</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedYear === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => onYearChange(null)}
              >
                Все курсы
              </Button>
              {academicYears.map((year) => (
                <Button
                  key={year}
                  variant={selectedYear === year ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onYearChange(year)}
                >
                  {year} курс
                </Button>
              ))}
            </div>
          </div>

          {/* Tags filter */}
          {availableTags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Теги</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedTag === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onTagChange(null)}
                >
                  Все теги
                </Button>
                {availableTags.slice(0, 10).map((tag) => (
                  <Button
                    key={tag}
                    variant={selectedTag === tag ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onTagChange(tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Clear filters button */}
          {hasActiveFilters && (
            <div className="pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Сбросить все фильтры
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
