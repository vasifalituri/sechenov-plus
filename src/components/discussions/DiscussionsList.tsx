'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { DiscussionCard } from './DiscussionCard';
import { DiscussionFilters } from './DiscussionFilters';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { Discussion, Subject } from '@/types/models';

interface DiscussionsListProps {
  initialDiscussions: Discussion[];
  subjects: Subject[];
}

export const DiscussionsList = memo(function DiscussionsList({ 
  initialDiscussions, 
  subjects 
}: DiscussionsListProps) {
  const [discussions, setDiscussions] = useState(initialDiscussions);
  const [isLoading, setIsLoading] = useState(false);
  const [sort, setSort] = useState('popular');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const fetchDiscussions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('sort', sort);
      if (selectedSubject) params.set('subjectId', selectedSubject);

      const response = await fetch(`/api/discussions?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setDiscussions(data.data);
      }
    } catch (error) {
      console.error('Error fetching discussions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sort, selectedSubject]);

  useEffect(() => {
    fetchDiscussions();
  }, [fetchDiscussions]);

  return (
    <div className="space-y-4">
      <DiscussionFilters
        sort={sort}
        selectedSubject={selectedSubject}
        subjects={subjects}
        onSortChange={setSort}
        onSubjectChange={setSelectedSubject}
      />

      {/* Discussions List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : discussions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Обсуждений не найдено</h3>
            <p className="text-muted-foreground text-center mb-4">
              Попробуйте изменить фильтры или создайте новую тему
            </p>
            <Link href="/discussions/new">
              <Button>Создать тему</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {discussions.map((discussion) => (
            <DiscussionCard key={discussion.id} discussion={discussion} />
          ))}
        </div>
      )}
    </div>
  );
});
