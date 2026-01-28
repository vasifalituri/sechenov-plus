'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

export default function CheckSessionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleRefresh = async () => {
    const response = await fetch('/api/auth/refresh-session', {
      method: 'POST',
    });
    const data = await response.json();
    
    if (data.success) {
      alert('Ваша роль в базе данных: ' + data.user.role + '\n\nПожалуйста, выйдите и войдите снова, чтобы обновить сессию.');
    }
  };

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Загрузка...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Проверка сессии</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Данные сессии:</h3>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>

          <div className="space-y-2">
            <p><strong>ID:</strong> {session?.user?.id}</p>
            <p><strong>Email:</strong> {session?.user?.email}</p>
            <p><strong>Имя:</strong> {session?.user?.name}</p>
            <p><strong>Username:</strong> {session?.user?.username}</p>
            <p>
              <strong>Роль:</strong>{' '}
              <Badge variant={session?.user?.role === 'ADMIN' ? 'destructive' : session?.user?.role === 'MODERATOR' ? 'default' : 'secondary'}>
                {session?.user?.role}
              </Badge>
            </p>
            <p><strong>Курс:</strong> {session?.user?.academicYear}</p>
            <p><strong>Статус:</strong> {session?.user?.status}</p>
          </div>

          <div className="flex gap-4">
            <Button onClick={handleRefresh}>
              Проверить роль в БД
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              На главную
            </Button>
          </div>

          {session?.user?.role === 'MODERATOR' && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm">
                ✅ Вы модератор! У вас должна быть кнопка "Админ-панель" в навигации.
              </p>
            </div>
          )}

          {session?.user?.role === 'ADMIN' && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm">
                👑 Вы администратор! У вас есть полный доступ.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
