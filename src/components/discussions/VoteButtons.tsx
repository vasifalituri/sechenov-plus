'use client';

import { useState, useCallback, memo } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VoteType } from '@/types/models';
import toast from 'react-hot-toast';

interface VoteButtonsProps {
  threadId?: string;
  commentId?: string;
  initialUpvotes: number;
  initialDownvotes: number;
  initialUserVote: VoteType | null;
  vertical?: boolean;
}

export const VoteButtons = memo(function VoteButtons({
  threadId,
  commentId,
  initialUpvotes,
  initialDownvotes,
  initialUserVote,
  vertical = true,
}: VoteButtonsProps) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote] = useState<VoteType | null>(initialUserVote);
  const [isLoading, setIsLoading] = useState(false);

  const score = upvotes - downvotes;

  const handleVote = useCallback(async (type: VoteType) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const endpoint = threadId
        ? `/api/discussions/${threadId}/vote`
        : `/api/discussions/${commentId?.split('-')[0]}/comments/${commentId}/vote`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        const data = await response.json();
        setUpvotes(data.upvotes);
        setDownvotes(data.downvotes);
        setUserVote(data.userVote);
        
        // Show toast notification
        if (data.userVote === null) {
          toast.success('Голос отменён');
        } else if (data.userVote === 'UPVOTE') {
          toast.success('Проголосовали за');
        } else {
          toast.success('Проголосовали против');
        }
      } else {
        toast.error('Не удалось проголосовать');
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, threadId, commentId]);

  const containerClass = vertical
    ? 'flex flex-col items-center gap-0'
    : 'flex items-center gap-2';

  return (
    <div className={containerClass}>
      <button
        onClick={() => handleVote('UPVOTE')}
        disabled={isLoading}
        className={cn(
          'p-0.5 rounded transition-colors disabled:opacity-50',
          userVote === 'UPVOTE' 
            ? 'text-orange-500 hover:text-orange-600' 
            : 'text-gray-400 hover:text-orange-500 dark:text-gray-500 dark:hover:text-orange-500'
        )}
        title="Upvote"
        aria-label="Upvote"
      >
        <ArrowUp className={cn('w-4 h-4 stroke-[2.5]', userVote === 'UPVOTE' && 'fill-current')} />
      </button>

      <span
        className={cn(
          'text-xs font-semibold min-w-[24px] text-center leading-none',
          userVote === 'UPVOTE' && 'text-orange-500',
          userVote === 'DOWNVOTE' && 'text-blue-500',
          !userVote && 'text-gray-700 dark:text-gray-300'
        )}
        aria-label={`Score: ${score}`}
      >
        {score}
      </span>

      <button
        onClick={() => handleVote('DOWNVOTE')}
        disabled={isLoading}
        className={cn(
          'p-0.5 rounded transition-colors disabled:opacity-50',
          userVote === 'DOWNVOTE' 
            ? 'text-blue-500 hover:text-blue-600' 
            : 'text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-500'
        )}
        title="Downvote"
        aria-label="Downvote"
      >
        <ArrowDown className={cn('w-4 h-4 stroke-[2.5]', userVote === 'DOWNVOTE' && 'fill-current')} />
      </button>
    </div>
  );
});
