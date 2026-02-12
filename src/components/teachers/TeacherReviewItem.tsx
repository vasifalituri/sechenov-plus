'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface TeacherReviewItemProps {
  review: {
    id: string;
    content: string;
    isAnonymous: boolean;
    status: string;
    helpfulCount: number;
    unhelpfulCount: number;
    createdAt: string;
    user: {
      id: string;
      fullName: string;
      username: string | null;
      profileImage: string | null;
    };
    helpfulness?: Array<{
      isHelpful: boolean;
    }>;
  };
  currentUserId?: string;
  isAdminOrModerator?: boolean;
  onUpdate?: () => void;
}

export default function TeacherReviewItem({
  review,
  currentUserId,
  isAdminOrModerator,
  onUpdate,
}: TeacherReviewItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount);
  const [unhelpfulCount, setUnhelpfulCount] = useState(review.unhelpfulCount);
  const [userVote, setUserVote] = useState(review.helpfulness?.[0]);

  const canDelete = currentUserId === review.user.id || isAdminOrModerator;

  const handleVote = async (isHelpful: boolean) => {
    setIsVoting(true);
    try {
      const response = await fetch(
        `/api/teachers/reviews/${review.id}/helpful`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isHelpful }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Не удалось оценить отзыв');
      }

      const updatedReview = await response.json();

      // Обновляем локальное состояние
      if (userVote && userVote.isHelpful !== isHelpful) {
        // Переключение с одного на другое
        if (isHelpful) {
          setHelpfulCount(helpfulCount + 1);
          setUnhelpfulCount(unhelpfulCount - 1);
        } else {
          setHelpfulCount(helpfulCount - 1);
          setUnhelpfulCount(unhelpfulCount + 1);
        }
      } else if (userVote && userVote.isHelpful === isHelpful) {
        // Toggle - удаляем голос
        if (isHelpful) {
          setHelpfulCount(helpfulCount - 1);
        } else {
          setUnhelpfulCount(unhelpfulCount - 1);
        }
        setUserVote(undefined);
      } else {
        // Новый голос
        if (isHelpful) {
          setHelpfulCount(helpfulCount + 1);
        } else {
          setUnhelpfulCount(unhelpfulCount + 1);
        }
        setUserVote({ isHelpful });
      }

      toast.success('Спасибо за вашу оценку!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsVoting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить этот отзыв?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/teachers/reviews/${review.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Не удалось удалить отзыв');
      }

      toast.success('Отзыв удален');
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const displayName = review.isAnonymous ? 'Анонимный студент' : review.user.fullName;
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            {!review.isAnonymous && review.user.profileImage && (
              <AvatarImage src={review.user.profileImage} alt={displayName} />
            )}
            <AvatarFallback className="bg-gray-100 text-gray-600">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{displayName}</p>
            <p className="text-sm text-gray-500">
              {new Date(review.createdAt).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 size={16} className="text-red-500" />
          </Button>
        )}
      </div>

      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
        {review.content}
      </p>

      {review.status === 'PENDING' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-2 text-sm text-yellow-800 dark:text-yellow-200">
          Отзыв ожидает модерации
        </div>
      )}

      {currentUserId && review.status === 'APPROVED' && (
        <div className="flex items-center gap-4 pt-2 border-t">
          <span className="text-sm text-gray-500">Полезен?</span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote(true)}
              disabled={isVoting}
              className={userVote?.isHelpful ? 'text-green-600' : ''}
            >
              <ThumbsUp size={16} />
              <span className="ml-1">{helpfulCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote(false)}
              disabled={isVoting}
              className={userVote && !userVote.isHelpful ? 'text-red-600' : ''}
            >
              <ThumbsDown size={16} />
              <span className="ml-1">{unhelpfulCount}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
