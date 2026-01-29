'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Pin, Trash2, MessageSquare, Reply } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { VoteButtons } from './VoteButtons';
import { getStaffBadge, getStaffColorClass } from '@/lib/permissions';

interface CommentItemProps {
  comment: any;
  threadId: string;
  onDelete?: () => void;
}

export function CommentItem({ comment, threadId, onDelete }: CommentItemProps) {
  const { data: session } = useSession();
  const [isPinned, setIsPinned] = useState(comment.isPinned);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR';

  const handlePin = async () => {
    try {
      const response = await fetch(
        `/api/discussions/${threadId}/comments/${comment.id}/pin`,
        { method: 'POST' }
      );
      const data = await response.json();

      if (data.success) {
        setIsPinned(data.isPinned);
        if (onDelete) onDelete(); // Refresh to show new order
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить этот комментарий?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/discussions/${threadId}/comments/${comment.id}`,
        { method: 'DELETE' }
      );

      if (response.ok && onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      setIsDeleting(false);
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim()) {
      setError('Комментарий не может быть пустым');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/discussions/${threadId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          parentId: comment.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setReplyContent('');
        setIsReplying(false);
        if (onDelete) onDelete(); // Refresh comments
      } else {
        setError(data.error || 'Ошибка отправки ответа');
      }
    } catch (err) {
      setError('Произошла ошибка при отправке ответа');
    } finally {
      setIsSubmitting(false);
    }
  };

  const score = comment.upvotes - comment.downvotes;

  return (
    <div className="group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {isPinned && (
            <Pin className="w-3 h-3 text-green-600 fill-green-600" />
          )}
          <Link href={`/users/${comment.author.username}`} className="flex items-center gap-1.5">
            <Avatar className="w-5 h-5">
              <AvatarImage src={comment.author.profileImage || undefined} alt={comment.author.fullName} />
              <AvatarFallback className="text-[10px]">
                {comment.author.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            {getStaffBadge(comment.author.role) && (
              <span className="text-xs" title={getStaffBadge(comment.author.role)?.label}>
                {getStaffBadge(comment.author.role)?.icon}
              </span>
            )}
            <span className={`font-semibold text-xs hover:underline ${getStaffColorClass(comment.author.role)}`}>
              @{comment.author.username}
            </span>
          </Link>
          <span className="text-xs text-muted-foreground">
            {comment.author.academicYear} курс
          </span>
          <span className="text-xs text-muted-foreground">
            • {formatDateTime(comment.createdAt)}
          </span>
          {score > 3 && (
            <span className="text-xs text-orange-500 font-medium">
              • {score} баллов
            </span>
          )}
        </div>
        
        <p className="text-sm mb-1.5 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
        
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsReplying(!isReplying)}
              className="h-6 px-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Reply className="w-3 h-3 mr-1" />
              Ответить
            </Button>

          {comment.replies && comment.replies.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="w-3 h-3" />
              {comment.replies.length} {comment.replies.length === 1 ? 'ответ' : 'ответов'}
            </span>
          )}

          {isAdmin && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePin}
                className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                title={isPinned ? 'Открепить' : 'Закрепить'}
              >
                <Pin className={`w-3 h-3 ${isPinned ? 'fill-current text-green-600' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Удалить"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </>
          )}
          </div>

          {/* Vote buttons - Reddit style, bottom right */}
          <div className="flex-shrink-0">
            <VoteButtons
              commentId={comment.id}
              initialUpvotes={comment.upvotes}
              initialDownvotes={comment.downvotes}
              initialUserVote={comment.userVote}
              vertical={true}
            />
          </div>
        </div>

        {/* Reply form */}
        {isReplying && (
          <div className="mt-3 space-y-2 bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-2 rounded text-xs">
                {error}
              </div>
            )}
            <Textarea
              placeholder="Напишите ответ..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleReply}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Отправка...' : 'Ответить'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsReplying(false);
                  setReplyContent('');
                  setError('');
                }}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
            </div>
          </div>
        )}

        {/* Render replies with better indentation */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-3 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
            {comment.replies.map((reply: any) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                threadId={threadId}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
