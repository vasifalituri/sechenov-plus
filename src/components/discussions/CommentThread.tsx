'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { formatDateTime } from '@/lib/utils';
import { MessageCircle, ThumbsUp } from 'lucide-react';

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  likesCount: number;
  author: {
    fullName: string;
    academicYear: number;
  };
  replies?: Comment[];
};

export function CommentThread({
  comment,
  threadId,
  depth = 0,
}: {
  comment: Comment;
  threadId: string;
  depth?: number;
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
        alert('Ваш ответ отправлен на модерацию');
      } else {
        setError(data.error || 'Ошибка отправки ответа');
      }
    } catch (err) {
      setError('Произошла ошибка при отправке ответа');
    } finally {
      setIsSubmitting(false);
    }
  };

  const maxDepth = 3; // Limit nesting depth

  return (
    <div className={depth > 0 ? 'ml-8 border-l-2 pl-4' : ''}>
      <Card className="p-4 mb-3">
        <div className="flex items-start justify-between mb-2">
          <div>
            <span className="font-medium">{comment.author.fullName}</span>
            <span className="text-sm text-muted-foreground ml-2">
              {comment.author.academicYear} курс
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDateTime(comment.createdAt)}
          </span>
        </div>

        <p className="text-sm mb-3 whitespace-pre-wrap">{comment.content}</p>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="h-8">
            <ThumbsUp className="w-3 h-3 mr-1" />
            {comment.likesCount}
          </Button>
          
          {depth < maxDepth && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => setIsReplying(!isReplying)}
            >
              <MessageCircle className="w-3 h-3 mr-1" />
              Ответить
            </Button>
          )}
        </div>

        {isReplying && (
          <div className="mt-3 space-y-2">
            {error && (
              <div className="bg-red-50 text-red-600 p-2 rounded text-sm">
                {error}
              </div>
            )}
            <Textarea
              placeholder="Ваш ответ..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              disabled={isSubmitting}
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleReply}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Отправка...' : 'Отправить'}
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
      </Card>

      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              threadId={threadId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
