'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, getStatusLabel, getStatusColor } from '@/lib/utils';
import { Check, X, Trash2, Pin } from 'lucide-react';
import { getStaffBadge, getStaffColorClass } from '@/lib/permissions';
import Link from 'next/link';

export default function AdminDiscussionsPage() {
  const [threads, setThreads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('PENDING');

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      const response = await fetch('/api/admin/discussions');
      const data = await response.json();
      if (data.success) {
        setThreads(data.data);
      }
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (threadId: string, status: string) => {
    try {
      const response = await fetch('/api/admin/discussions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, status }),
      });

      const data = await response.json();
      if (data.success) {
        fetchThreads();
        alert(data.message);
      }
    } catch (error) {
      console.error('Error updating thread:', error);
    }
  };

  const handleTogglePin = async (threadId: string, isPinned: boolean) => {
    try {
      const response = await fetch('/api/admin/discussions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, isPinned: !isPinned }),
      });

      const data = await response.json();
      if (data.success) {
        fetchThreads();
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    if (!confirm('Вы уверены, что хотите удалить это обсуждение?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/discussions?threadId=${threadId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        fetchThreads();
        alert(data.message);
      }
    } catch (error) {
      console.error('Error deleting thread:', error);
    }
  };

  const filteredThreads = threads.filter((thread) => {
    if (filter === 'ALL') return true;
    return thread.status === filter;
  });

  const stats = {
    all: threads.length,
    pending: threads.filter((t) => t.status === 'PENDING').length,
    approved: threads.filter((t) => t.status === 'APPROVED').length,
    rejected: threads.filter((t) => t.status === 'REJECTED').length,
  };

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Модерация обсуждений</h2>
        <p className="text-muted-foreground mt-2">
          Проверяйте и одобряйте обсуждения
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="cursor-pointer" onClick={() => setFilter('ALL')}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.all}</div>
            <p className="text-sm text-muted-foreground">Всего</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setFilter('PENDING')}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">На модерации</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setFilter('APPROVED')}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-sm text-muted-foreground">Одобрено</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setFilter('REJECTED')}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-sm text-muted-foreground">Отклонено</p>
          </CardContent>
        </Card>
      </div>

      {/* Threads List */}
      <Card>
        <CardHeader>
          <CardTitle>Обсуждения</CardTitle>
          <CardDescription>
            Показано {filteredThreads.length} из {threads.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredThreads.map((thread) => (
              <div
                key={thread.id}
                className="flex items-start justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {thread.isPinned && <Pin className="w-4 h-4 text-blue-600" />}
                    <Badge variant="secondary">{thread.subject.name}</Badge>
                    <Badge variant="outline">{thread.academicYear} курс</Badge>
                  </div>
                  <h4 className="font-medium mb-1">{thread.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {thread.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      Автор:{' '}
                      {thread.author.username ? (
                        <Link href={`/users/${thread.author.username}`} className="flex items-center gap-1" target="_blank">
                          {getStaffBadge(thread.author.role) && (
                            <span className="text-xs" title={getStaffBadge(thread.author.role)?.label}>
                              {getStaffBadge(thread.author.role)?.icon}
                            </span>
                          )}
                          <span className={`hover:underline font-medium ${getStaffColorClass(thread.author.role) || 'text-blue-600 dark:text-blue-400'}`}>
                            {thread.author.fullName}
                          </span>
                        </Link>
                      ) : (
                        <span>{thread.author.fullName}</span>
                      )}
                    </span>
                    <span>•</span>
                    <span>Комментариев: {thread._count.comments}</span>
                    <span>•</span>
                    <span>{formatDate(thread.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Badge className={getStatusColor(thread.status)}>
                    {getStatusLabel(thread.status)}
                  </Badge>

                  {thread.status === 'APPROVED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTogglePin(thread.id, thread.isPinned)}
                    >
                      <Pin className={`w-4 h-4 ${thread.isPinned ? 'fill-current' : ''}`} />
                    </Button>
                  )}

                  {thread.status === 'PENDING' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(thread.id, 'APPROVED')}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleUpdateStatus(thread.id, 'REJECTED')}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteThread(thread.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {filteredThreads.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Обсуждений не найдено
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
