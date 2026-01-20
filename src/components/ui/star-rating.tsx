'use client';

import { useState, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface StarRatingProps {
  materialId: string;
  onRatingChange?: () => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  showCount?: boolean;
}

export function StarRating({
  materialId,
  onRatingChange,
  size = 'md',
  readonly = false,
  showCount = true,
}: StarRatingProps) {
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  useEffect(() => {
    fetchRating();
  }, [materialId]);

  const fetchRating = async () => {
    try {
      const response = await fetch(`/api/materials/${materialId}/rating`);
      if (response.ok) {
        const data = await response.json();
        setAverageRating(data.averageRating);
        setTotalRatings(data.totalRatings);
        setUserRating(data.userRating);
      }
    } catch (error) {
      console.error('Fetch rating error:', error);
    }
  };

  const handleRating = async (rating: number) => {
    if (readonly || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/materials/${materialId}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating }),
      });

      if (response.ok) {
        setUserRating(rating);
        await fetchRating(); // Refresh to get new average
        onRatingChange?.();
        toast.success(`Оценка ${rating} из 5 сохранена`);
      } else {
        const data = await response.json();
        console.error('Rating error:', data.error);
        toast.error('Не удалось сохранить оценку');
      }
    } catch (error) {
      console.error('Submit rating error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveRating = async () => {
    if (readonly || isLoading || !userRating) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/materials/${materialId}/rating`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUserRating(null);
        await fetchRating(); // Refresh to get new average
        onRatingChange?.();
        toast.success('Оценка удалена');
      } else {
        const data = await response.json();
        console.error('Remove rating error:', data.error);
        toast.error('Не удалось удалить оценку');
      }
    } catch (error) {
      console.error('Remove rating error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const displayRating = readonly ? averageRating : (hoverRating || userRating || averageRating);

  return (
    <div className="flex items-center gap-3" suppressHydrationWarning>
      <div className="flex items-center gap-0.5" suppressHydrationWarning>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= Math.round(displayRating);
          const isPartial = !isFilled && star === Math.ceil(displayRating) && displayRating % 1 !== 0;

          return (
            <button
              key={star}
              type="button"
              onClick={() => handleRating(star)}
              onMouseEnter={() => !readonly && setHoverRating(star)}
              onMouseLeave={() => !readonly && setHoverRating(null)}
              disabled={readonly || isLoading}
              className={cn(
                'transition-all',
                !readonly && 'cursor-pointer hover:scale-110',
                readonly && 'cursor-default',
                isLoading && 'opacity-50'
              )}
              title={readonly ? `${averageRating.toFixed(1)} из 5` : `Оценить ${star} из 5`}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  'transition-colors',
                  isFilled && 'fill-yellow-400 text-yellow-400',
                  isPartial && 'fill-yellow-200 text-yellow-400',
                  !isFilled && !isPartial && 'text-gray-300 dark:text-gray-600',
                  !readonly && hoverRating && star <= hoverRating && 'fill-yellow-300 text-yellow-300'
                )}
              />
            </button>
          );
        })}
      </div>

      {showCount && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground" suppressHydrationWarning>
          <span className="font-medium">{averageRating.toFixed(1)}</span>
          <span>({totalRatings})</span>
        </div>
      )}

      {!readonly && userRating && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Ваша оценка: {userRating}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveRating}
            disabled={isLoading}
            className="h-6 px-2 text-xs"
            title="Удалить оценку"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
