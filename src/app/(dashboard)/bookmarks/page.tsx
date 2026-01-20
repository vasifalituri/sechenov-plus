'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bookmark, FileText, MessageSquare, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BookmarkItem {
  id: string;
  type: 'MATERIAL' | 'DISCUSSION';
  note?: string;
  createdAt: string;
  material?: {
    id: string;
    title: string;
    description?: string;
    subject: {
      name: string;
    };
    uploadedBy: {
      fullName: string;
    };
  };
  discussion?: {
    id: string;
    title: string;
    content: string;
    subject?: {
      name: string;
    };
    author: {
      fullName: string;
    };
    _count: {
      comments: number;
    };
  };
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'MATERIAL' | 'DISCUSSION'>('all');

  useEffect(() => {
    fetchBookmarks();
  }, [filter]);

  const fetchBookmarks = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.set('type', filter);
      }

      const response = await fetch(`/api/bookmarks?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setBookmarks(data);
      }
    } catch (error) {
      console.error('Fetch bookmarks error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBookmark = async (bookmarkId: string) => {
    try {
      const response = await fetch(`/api/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBookmarks(bookmarks.filter((b) => b.id !== bookmarkId));
      }
    } catch (error) {
      console.error('Delete bookmark error:', error);
    }
  };

  const filteredBookmarks = bookmarks;

  const materialBookmarks = filteredBookmarks.filter((b) => b.type === 'MATERIAL');
  const discussionBookmarks = filteredBookmarks.filter((b) => b.type === 'DISCUSSION');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Bookmark className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold">Избранное</h1>
            <p className="text-muted-foreground">
              Ваши сохраненные материалы и обсуждения
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          Всё ({bookmarks.length})
        </Button>
        <Button
          variant={filter === 'MATERIAL' ? 'default' : 'outline'}
          onClick={() => setFilter('MATERIAL')}
        >
          <FileText className="w-4 h-4 mr-2" />
          Материалы ({materialBookmarks.length})
        </Button>
        <Button
          variant={filter === 'DISCUSSION' ? 'default' : 'outline'}
          onClick={() => setFilter('DISCUSSION')}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Обсуждения ({discussionBookmarks.length})
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredBookmarks.length === 0 && (
        <Card className="p-12 text-center">
          <Bookmark className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">Нет закладок</h3>
          <p className="text-muted-foreground mb-4">
            {filter === 'all'
              ? 'Вы еще не добавили ничего в избранное'
              : filter === 'MATERIAL'
              ? 'Нет сохраненных материалов'
              : 'Нет сохраненных обсуждений'}
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/materials">
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                К материалам
              </Button>
            </Link>
            <Link href="/discussions">
              <Button variant="outline">
                <MessageSquare className="w-4 h-4 mr-2" />
                К обсуждениям
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Bookmarks List */}
      {!isLoading && filteredBookmarks.length > 0 && (
        <div className="space-y-4">
          {filteredBookmarks.map((bookmark) => (
            <Card key={bookmark.id} className="p-6">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                    bookmark.type === 'MATERIAL'
                      ? 'bg-blue-100 dark:bg-blue-900'
                      : 'bg-green-100 dark:bg-green-900'
                  )}
                >
                  {bookmark.type === 'MATERIAL' ? (
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {bookmark.type === 'MATERIAL' && bookmark.material && (
                    <>
                      <Link
                        href={`/materials/${bookmark.material.id}`}
                        className="text-lg font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {bookmark.material.title}
                      </Link>
                      {bookmark.material.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {bookmark.material.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-3">
                        <Badge variant="secondary">
                          {bookmark.material.subject.name}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {bookmark.material.uploadedBy.fullName}
                        </span>
                      </div>
                    </>
                  )}

                  {bookmark.type === 'DISCUSSION' && bookmark.discussion && (
                    <>
                      <Link
                        href={`/discussions/${bookmark.discussion.id}`}
                        className="text-lg font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {bookmark.discussion.title}
                      </Link>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {bookmark.discussion.content}
                      </p>
                      <div className="flex items-center gap-3 mt-3">
                        {bookmark.discussion.subject && (
                          <Badge variant="secondary">
                            {bookmark.discussion.subject.name}
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {bookmark.discussion.author.fullName}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {bookmark.discussion._count.comments} комм.
                        </span>
                      </div>
                    </>
                  )}

                  {bookmark.note && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <p className="text-sm italic">{bookmark.note}</p>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-3">
                    Добавлено {new Date(bookmark.createdAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>

                {/* Actions */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteBookmark(bookmark.id)}
                  className="flex-shrink-0"
                  title="Удалить из избранного"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
