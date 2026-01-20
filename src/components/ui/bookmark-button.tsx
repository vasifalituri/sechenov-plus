'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface BookmarkButtonProps {
  type: 'MATERIAL' | 'DISCUSSION';
  itemId: string;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'ghost';
  showLabel?: boolean;
}

export function BookmarkButton({
  type,
  itemId,
  className,
  size = 'default',
  variant = 'ghost',
  showLabel = false,
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if item is bookmarked on mount
  useEffect(() => {
    checkBookmarkStatus();
  }, [itemId, type]);

  const checkBookmarkStatus = async () => {
    try {
      const params = new URLSearchParams();
      if (type === 'MATERIAL') {
        params.set('materialId', itemId);
      } else {
        params.set('discussionId', itemId);
      }

      const response = await fetch(`/api/bookmarks/check?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setIsBookmarked(data.isBookmarked);
        setBookmarkId(data.bookmarkId);
      }
    } catch (error) {
      console.error('Check bookmark error:', error);
    }
  };

  const handleToggleBookmark = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (isBookmarked && bookmarkId) {
        // Remove bookmark
        console.log('Removing bookmark:', bookmarkId);
        const response = await fetch(`/api/bookmarks/${bookmarkId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          console.log('Bookmark removed successfully');
          setIsBookmarked(false);
          setBookmarkId(null);
          toast.success('Удалено из избранного');
        } else {
          console.error('Failed to remove bookmark:', await response.text());
          toast.error('Не удалось удалить из избранного');
        }
      } else {
        // Add bookmark
        const payload = {
          type,
          materialId: type === 'MATERIAL' ? itemId : undefined,
          discussionId: type === 'DISCUSSION' ? itemId : undefined,
        };
        console.log('Adding bookmark:', payload);
        
        const response = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        console.log('Response:', response.status, data);

        if (response.ok) {
          console.log('Bookmark added successfully:', data);
          setIsBookmarked(true);
          setBookmarkId(data.id);
          toast.success('Добавлено в избранное');
        } else {
          console.error('Failed to add bookmark:', data);
          toast.error('Не удалось добавить в избранное');
        }
      }
    } catch (error) {
      console.error('Toggle bookmark error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleBookmark}
      disabled={isLoading}
      className={cn(className)}
      title={isBookmarked ? 'Удалить из избранного' : 'Добавить в избранное'}
    >
      <Star 
        className={cn(
          'w-4 h-4', 
          showLabel && 'mr-2',
          isBookmarked && 'fill-yellow-400 text-yellow-400'
        )} 
      />
      {showLabel && (isBookmarked ? 'В избранном' : 'Добавить')}
    </Button>
  );
}
