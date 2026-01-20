'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { User, FileText, MessageSquare, MessageCircle } from 'lucide-react';
import { ProfileImageUpload } from './ProfileImageUpload';

interface ProfileData {
  user: {
    id: string;
    email: string;
    fullName: string;
    academicYear: number;
    role: string;
    status: string;
    createdAt: Date;
    profileImage: string | null;
  } | null;
  materials: any[];
  threads: any[];
  comments: any[];
  stats: {
    materials: number;
    threads: number;
    comments: number;
  };
}

export function ProfilePageClient({ initialProfile }: { initialProfile: ProfileData }) {
  const [profileImage, setProfileImage] = useState(initialProfile.user?.profileImage || null);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Профиль</h1>
        <p className="text-muted-foreground mt-2">
          Ваша информация и активность
        </p>
      </div>

      {/* Profile Image Section */}
      <Card>
        <CardHeader>
          <CardTitle>Фото профиля</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <ProfileImageUpload
            currentImage={profileImage}
            userName={initialProfile.user?.fullName || ''}
            onImageUpdate={setProfileImage}
          />
        </CardContent>
      </Card>

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Информация о пользователе
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Имя</p>
              <p className="font-medium">{initialProfile.user?.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{initialProfile.user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Курс</p>
              <p className="font-medium">{initialProfile.user?.academicYear} курс</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Роль</p>
              <Badge>{initialProfile.user?.role}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Дата регистрации</p>
              <p className="font-medium">{formatDate(initialProfile.user?.createdAt || new Date())}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Загружено материалов</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialProfile.stats.materials}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Создано обсуждений</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialProfile.stats.threads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Комментариев</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialProfile.stats.comments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Materials */}
      <Card>
        <CardHeader>
          <CardTitle>Мои материалы</CardTitle>
          <CardDescription>Последние загруженные материалы</CardDescription>
        </CardHeader>
        <CardContent>
          {initialProfile.materials.length === 0 ? (
            <p className="text-muted-foreground text-sm">Вы еще не загружали материалы</p>
          ) : (
            <div className="space-y-3">
              {initialProfile.materials.map((material) => (
                <div key={material.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{material.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {material.subject.name} • {material.academicYear} курс
                    </p>
                  </div>
                  <Badge className={
                    material.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    material.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {material.status === 'APPROVED' ? 'Одобрено' :
                     material.status === 'PENDING' ? 'На модерации' : 'Отклонено'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Threads */}
      <Card>
        <CardHeader>
          <CardTitle>Мои обсуждения</CardTitle>
          <CardDescription>Последние созданные темы</CardDescription>
        </CardHeader>
        <CardContent>
          {initialProfile.threads.length === 0 ? (
            <p className="text-muted-foreground text-sm">Вы еще не создавали обсуждения</p>
          ) : (
            <div className="space-y-3">
              {initialProfile.threads.map((thread) => (
                <div key={thread.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{thread.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {thread.subject.name} • {thread.academicYear} курс
                    </p>
                  </div>
                  <Badge className={
                    thread.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    thread.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {thread.status === 'APPROVED' ? 'Одобрено' :
                     thread.status === 'PENDING' ? 'На модерации' : 'Отклонено'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
