'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, getStatusLabel, getStatusColor } from '@/lib/utils';
import { Check, X, Trash2, Mail, MailCheck, RefreshCw } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (userId: string, status: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status }),
      });

      const data = await response.json();
      if (data.success) {
        fetchUsers();
        alert(data.message);
      } else {
        alert(data.error || 'Ошибка при обновлении статуса');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Ошибка при обновлении статуса');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        fetchUsers();
        alert(data.message);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (filter === 'ALL') return true;
    return user.status === filter;
  });

  const stats = {
    all: users.length,
    pending: users.filter((u) => u.status === 'PENDING').length,
    approved: users.filter((u) => u.status === 'APPROVED').length,
    rejected: users.filter((u) => u.status === 'REJECTED').length,
  };

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Управление пользователями</h2>
          <p className="text-muted-foreground mt-2">
            Одобряйте или отклоняйте заявки на регистрацию
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Обновлено: {lastUpdated.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={isLoading}
            title="Обновить список"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
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

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Пользователи</CardTitle>
          <CardDescription>
            Показано {filteredUsers.length} из {users.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{user.fullName}</h4>
                        {user.emailVerified ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <MailCheck className="w-3 h-3 mr-1" />
                            Email подтвержден
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            <Mail className="w-3 h-3 mr-1" />
                            Email не подтвержден
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {user.email} • {user.academicYear} курс • {user.role}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Зарегистрирован: {formatDate(user.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(user.status)}>
                    {getStatusLabel(user.status)}
                  </Badge>

                  {user.status === 'PENDING' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(user.id, 'APPROVED')}
                        disabled={!user.emailVerified}
                        title={!user.emailVerified ? 'Пользователь должен подтвердить email' : 'Одобрить пользователя'}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Одобрить
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleUpdateStatus(user.id, 'REJECTED')}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Отклонить
                      </Button>
                    </>
                  )}

                  {user.role !== 'ADMIN' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Пользователей не найдено
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
