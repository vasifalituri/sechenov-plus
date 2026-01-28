'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
} from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  priority: number;
  isActive: boolean;
  createdAt: string;
  expiresAt: string | null;
  author: {
    id: string;
    fullName: string;
    email: string;
  };
}

export default function AdminAnnouncementsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'INFO' as Announcement['type'],
    priority: 0,
    expiresAt: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [session, status, router]);

  useEffect(() => {
    fetchAnnouncements();
  }, [includeInactive]);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch(
        `/api/admin/announcements?includeInactive=${includeInactive}`
      );
      const data = await response.json();
      setAnnouncements(data.announcements || []);
    } catch (error) {
      toast.error('Ошибка загрузки объявлений');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingId
        ? `/api/admin/announcements/${editingId}`
        : '/api/admin/announcements';

      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          expiresAt: formData.expiresAt || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || 'Неизвестная ошибка';
        console.error('API Error:', data);
        throw new Error(errorMsg);
      }

      toast.success(
        editingId ? 'Объявление обновлено' : 'Объявление создано'
      );
      setShowForm(false);
      setEditingId(null);
      resetForm();
      fetchAnnouncements();
    } catch (error) {
      console.error('Submit error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ошибка сохранения объявления';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      expiresAt: announcement.expiresAt
        ? new Date(announcement.expiresAt).toISOString().slice(0, 16)
        : '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить объявление?')) return;

    try {
      const response = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error();

      toast.success('Объявление удалено');
      fetchAnnouncements();
    } catch (error) {
      toast.error('Ошибка удаления объявления');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/announcements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) throw new Error();

      toast.success(
        currentStatus ? 'Объявление скрыто' : 'Объявление опубликовано'
      );
      fetchAnnouncements();
    } catch (error) {
      toast.error('Ошибка изменения статуса');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'INFO',
      priority: 0,
      expiresAt: '',
    });
  };

  const getTypeIcon = (type: Announcement['type']) => {
    switch (type) {
      case 'INFO':
        return <Info className="h-4 w-4" />;
      case 'WARNING':
        return <AlertCircle className="h-4 w-4" />;
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4" />;
      case 'ERROR':
        return <XCircle className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: Announcement['type']) => {
    switch (type) {
      case 'INFO':
        return 'bg-blue-100 text-blue-800';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800';
      case 'SUCCESS':
        return 'bg-green-100 text-green-800';
      case 'ERROR':
        return 'bg-red-100 text-red-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Управление объявлениями</h1>
          <p className="text-gray-600 mt-1">
            Создавайте и управляйте объявлениями на главной странице
          </p>
        </div>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            resetForm();
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Новое объявление
        </Button>
      </div>

      <div className="mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-gray-600">
            Показать скрытые объявления
          </span>
        </label>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {editingId ? 'Редактировать объявление' : 'Новое объявление'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Заголовок *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Важное объявление"
                  required
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Содержание *
                </label>
                <Textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Подробное описание объявления"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Тип
                  </label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: Announcement['type']) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INFO">Информация</SelectItem>
                      <SelectItem value="WARNING">Предупреждение</SelectItem>
                      <SelectItem value="SUCCESS">Успех</SelectItem>
                      <SelectItem value="ERROR">Ошибка</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Приоритет (0-100)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Чем выше, тем выше в списке
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Истекает (опционально)
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) =>
                      setFormData({ ...formData, expiresAt: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingId ? 'Обновить' : 'Создать'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    resetForm();
                  }}
                >
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Нет объявлений. Создайте первое!
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id} className={!announcement.isActive ? 'opacity-60' : ''}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getTypeColor(announcement.type)}>
                        <span className="flex items-center gap-1">
                          {getTypeIcon(announcement.type)}
                          {announcement.type}
                        </span>
                      </Badge>
                      {announcement.priority > 0 && (
                        <Badge variant="outline">
                          Приоритет: {announcement.priority}
                        </Badge>
                      )}
                      {!announcement.isActive && (
                        <Badge variant="secondary">Скрыто</Badge>
                      )}
                    </div>

                    <h3 className="text-xl font-semibold mb-2">
                      {announcement.title}
                    </h3>
                    <p className="text-gray-600 whitespace-pre-wrap mb-3">
                      {announcement.content}
                    </p>

                    <div className="text-sm text-gray-500">
                      <p>Автор: {announcement.author.fullName}</p>
                      <p>
                        Создано:{' '}
                        {new Date(announcement.createdAt).toLocaleString('ru-RU')}
                      </p>
                      {announcement.expiresAt && (
                        <p>
                          Истекает:{' '}
                          {new Date(announcement.expiresAt).toLocaleString('ru-RU')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(announcement)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        toggleActive(announcement.id, announcement.isActive)
                      }
                    >
                      {announcement.isActive ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(announcement.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
