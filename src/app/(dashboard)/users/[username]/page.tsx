'use client';

import { use, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Mail, User, Calendar, BookOpen, MessageSquare } from 'lucide-react';

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const { data: session } = useSession();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ materials: 0, discussions: 0, comments: 0 });

  useEffect(() => {
    fetchUser();
  }, [username]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/users/${username}`);
      const data = await response.json();
      
      if (data.success) {
        setUser(data.data);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching user:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Загрузка...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Пользователь не найден</h1>
        <Link href="/dashboard">
          <Button>Вернуться на главную</Button>
        </Link>
      </div>
    );
  }

  const isOwnProfile = session?.user?.id === user.id;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/dashboard">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>
      </Link>

      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={user.profileImage || undefined} alt={user.fullName} />
                  <AvatarFallback className="text-2xl">
                    {user.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold">@{user.username}</h1>
                  <p className="text-muted-foreground">{user.fullName}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{user.academicYear} курс</span>
                </div>
                <Badge variant={user.status === 'APPROVED' ? 'default' : 'secondary'}>
                  {user.status === 'APPROVED' ? 'Активен' : user.status}
                </Badge>
                {user.role === 'ADMIN' && (
                  <Badge variant="destructive">Администратор</Badge>
                )}
              </div>
            </div>

            {!isOwnProfile && (
              <Link href={`/messages?user=${user.username}`}>
                <Button>
                  <Mail className="w-4 h-4 mr-2" />
                  Написать
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Участник с {new Date(user.createdAt).toLocaleDateString('ru-RU')}
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Материалы</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.materials}</div>
            <p className="text-xs text-muted-foreground">
              Загружено материалов
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Обсуждения</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.discussions}</div>
            <p className="text-xs text-muted-foreground">
              Создано обсуждений
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Комментарии</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.comments}</div>
            <p className="text-xs text-muted-foreground">
              Оставлено комментариев
            </p>
          </CardContent>
        </Card>
      </div>

      {isOwnProfile && (
        <Card>
          <CardHeader>
            <CardTitle>Настройки профиля</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Для изменения профиля обратитесь к администратору
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
