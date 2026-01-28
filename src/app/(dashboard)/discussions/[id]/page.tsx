'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { MentionTextarea } from '@/components/ui/mention-textarea';
import { BookmarkButton } from '@/components/ui/bookmark-button';
import { CommentItem } from '@/components/discussions/CommentItem';
import { VoteButtons } from '@/components/discussions/VoteButtons';
import { ArrowLeft, MessageCircle, Pin, Trash2 } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { getStaffBadge, getStaffColorClass } from '@/lib/permissions';

export default function DiscussionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const [thread, setThread] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR';

  useEffect(() => {
    fetchThread();
  }, [id]);

  const fetchThread = async () => {
    try {
      const response = await fetch(`/api/discussions/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setThread(data.data);
        setIsPinned(data.data.isPinned);
      }
    } catch (err) {
      console.error('Error fetching thread:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePin = async () => {
    try {
      const response = await fetch(`/api/discussions/${id}/pin`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setIsPinned(data.isPinned);
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить это обсуждение?')) {
      return;
    }

    try {
      const response = await fetch(`/api/discussions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/discussions');
      }
    } catch (error) {
      console.error('Error deleting discussion:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentContent.trim()) {
      setError('Комментарий не может быть пустым');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/discussions/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: commentContent,
          mentionedUsers: mentionedUsers.length > 0 ? mentionedUsers : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCommentContent('');
        // Обновляем список комментариев после успешного добавления
        await fetchThread();
      } else {
        setError(data.error || 'Ошибка отправки комментария');
      }
    } catch (err) {
      setError('Произошла ошибка при отправке комментария');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground mb-4">Обсуждение не найдено</p>
        <Link href="/discussions">
          <Button>Вернуться к обсуждениям</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/discussions">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад к обсуждениям
        </Button>
      </Link>

      {/* Thread Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                {isPinned && <Pin className="w-4 h-4 text-blue-600 fill-blue-600" />}
                <Badge variant="secondary">{thread.subject.name}</Badge>
                <Badge variant="outline">{thread.academicYear} курс</Badge>
              </div>
              <CardTitle className="text-3xl">{thread.title}</CardTitle>
            </div>
            <div className="flex gap-2">
              <BookmarkButton
                type="DISCUSSION"
                itemId={thread.id}
                variant="ghost"
                size="icon"
              />
              {isAdmin && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePin}
                    title={isPinned ? 'Открепить' : 'Закрепить'}
                  >
                    <Pin className={`w-4 h-4 ${isPinned ? 'fill-current' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDelete}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {/* Vote buttons */}
            <div className="flex-shrink-0">
              <VoteButtons
                threadId={thread.id}
                initialUpvotes={thread.upvotes}
                initialDownvotes={thread.downvotes}
                initialUserVote={thread.userVote}
                vertical={true}
              />
            </div>

            {/* Content */}
            <div className="flex-1 space-y-4">
              <p className="text-base whitespace-pre-wrap leading-relaxed">{thread.content}</p>

              <div className="flex items-center gap-4 pt-4 border-t text-sm text-muted-foreground">
                <Link href={`/users/${thread.author.username}`} className="flex items-center gap-1.5">
                  {getStaffBadge(thread.author.role) && (
                    <span className="text-sm" title={getStaffBadge(thread.author.role)?.label}>
                      {getStaffBadge(thread.author.role)?.icon}
                    </span>
                  )}
                  <span className={`font-medium hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer ${getStaffColorClass(thread.author.role)}`}>
                    @{thread.author.username}
                  </span>
                </Link>
                <span>•</span>
                <span>{thread.author.academicYear} курс</span>
                <span>•</span>
                <span>{formatDateTime(thread.createdAt)}</span>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{thread._count.comments} комментариев</span>
                </div>
                {thread.score > 0 && (
                  <div className="flex items-center gap-1 text-orange-500 font-medium">
                    🔥 {thread.score} баллов
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Comment */}
      <Card>
        <CardHeader>
          <CardTitle>Добавить комментарий</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          <MentionTextarea
            placeholder="Поделитесь своим опытом или задайте вопрос..."
            value={commentContent}
            onChange={setCommentContent}
            onMentionedUsers={setMentionedUsers}
            minRows={4}
          />
          <Button onClick={handleSubmitComment} disabled={isSubmitting}>
            {isSubmitting ? 'Отправка...' : 'Отправить комментарий'}
          </Button>
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle>
            Комментарии ({thread.comments?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!thread.comments || thread.comments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Пока нет комментариев. Будьте первым!
            </p>
          ) : (
            <div className="space-y-6">
              {thread.comments.map((comment: any) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  threadId={thread.id}
                  onDelete={fetchThread}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
