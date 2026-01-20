'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SubjectSelect } from '@/components/ui/subject-select';
import type { Subject } from '@/types/models';

interface DiscussionFiltersProps {
  sort: string;
  selectedSubject: string | null;
  subjects: Subject[];
  onSortChange: (sort: string) => void;
  onSubjectChange: (subjectId: string | null) => void;
}

const sortButtons = [
  { value: 'popular', label: '🔥 Популярное', description: 'Обсуждения с наибольшей активностью за последний месяц' },
  { value: 'new', label: '🆕 Новое', description: 'Обсуждения за последнюю неделю' },
];

export const DiscussionFilters = memo(function DiscussionFilters({
  sort,
  selectedSubject,
  subjects,
  onSortChange,
  onSubjectChange,
}: DiscussionFiltersProps) {
  // Add "Все" option to subjects
  const subjectsWithAll = [
    { id: '', name: 'Все предметы', slug: 'all', order: 0 },
    ...subjects,
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Sort buttons */}
          <div>
            <h3 className="text-sm font-medium mb-2">Сортировка</h3>
            <div className="flex flex-wrap gap-2">
              {sortButtons.map((btn) => (
                <Button
                  key={btn.value}
                  variant={sort === btn.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onSortChange(btn.value)}
                  title={btn.description}
                >
                  {btn.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Subject filter with dropdown */}
          <div>
            <h3 className="text-sm font-medium mb-2">Предмет</h3>
            <SubjectSelect
              value={selectedSubject || ''}
              onChange={(value) => onSubjectChange(value === '' ? null : value)}
              subjects={subjectsWithAll}
              placeholder="Выберите предмет..."
              className="max-w-md"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
