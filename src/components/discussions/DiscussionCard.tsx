'use client';

import { useState, useCallback, memo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Pin, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { VoteButtons } from './VoteButtons';
import type { Discussion } from '@/types/models';

interface DiscussionCardProps {
  discussion: Discussion;
}

export const DiscussionCard = memo(function DiscussionCard({ discussion }: DiscussionCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isPinned, setIsPinned] = useState(discussion.isPinned);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = session?.user?.role === 'ADMIN';

  const handlePin = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const response = await fetch(`/api/discussions/${discussion.id}/pin`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setIsPinned(data.isPinned);
        router.refresh();
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  }, [discussion.id, router]);

  const handleDelete = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Вы уверены, что хотите удалить это обсуждение?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/discussions/${discussion.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error deleting discussion:', error);
      setIsDeleting(false);
    }
  }, [discussion.id, router]);

  return (
    <Card className="hover:border-gray-400 dark:hover:border-gray-600 transition-colors overflow-hidden">
      <div className="flex gap-2 p-2">
        {/* Vote buttons - Reddit style */}
        <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">
          <VoteButtons
            threadId={discussion.id}
            initialUpvotes={discussion.upvotes}
            initialDownvotes={discussion.downvotes}
            initialUserVote={discussion.userVote}
            vertical={true}
          />
        </div>

        {/* Content */}
        <div 
          onClick={() => router.push(`/discussions/${discussion.id}`)}
          className="flex-1 min-w-0 cursor-pointer"
        >
          <div className="space-y-2">
            {/* Header */}
            <div className="flex items-center gap-2 flex-wrap">
              {isPinned && (
                <Pin className="w-4 h-4 text-green-600 fill-green-600" />
              )}
              <Badge variant="secondary" className="text-xs">
                {discussion.subject.name}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {discussion.academicYear} курс
              </Badge>
              <span className="text-xs text-muted-foreground">
                •
              </span>
              <Link 
                href={`/users/${discussion.author.username}`} 
                onClick={(e) => e.stopPropagation()}
                className={`flex items-center gap-1.5 text-xs hover:text-blue-600 dark:hover:text-blue-400 ${
                  discussion.author.role === 'ADMIN' 
                    ? 'text-cyan-600 dark:text-cyan-400 font-semibold' 
                    : 'text-muted-foreground'
                }`}
              >
                <Avatar className="w-5 h-5">
                  <AvatarImage src={discussion.author.profileImage || undefined} alt={discussion.author.fullName} />
                  <AvatarFallback className="text-[10px]">
                    {discussion.author.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                @{discussion.author.username}
              </Link>
              <span className="text-xs text-muted-foreground">
                • {formatDate(discussion.createdAt)}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-base font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2">
              {discussion.title}
            </h3>

            {/* Content preview */}
            <p className="text-sm text-muted-foreground line-clamp-2">
              {discussion.content}
            </p>

            {/* Footer */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded transition-colors">
                <MessageCircle className="w-4 h-4" />
                {discussion._count.comments} комментариев
              </span>
              {discussion.score > 0 && (
                <span className="text-orange-500 font-medium">
                  🔥 {discussion.score} баллов
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Admin actions */}
        {isAdmin && (
          <div className="flex flex-col gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePin}
              title={isPinned ? 'Открепить' : 'Закрепить'}
              className="h-8 w-8"
            >
              <Pin className={`w-4 h-4 ${isPinned ? 'fill-current text-green-600' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Удалить"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
});
