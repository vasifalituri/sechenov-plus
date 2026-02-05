'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Upload, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function AdminTeachersClient() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    department: '',
    position: '',
    bio: '',
    academicDegree: '',
    photoUrl: '',
    subjectIds: [] as string[],
    isActive: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teachersRes, subjectsRes] = await Promise.all([
        fetch('/api/teachers?sortBy=fullName'),
        fetch('/api/subjects'),
      ]);

      if (teachersRes.ok) {
        const teachersData = await teachersRes.json();
        setTeachers(teachersData);
      }

      if (subjectsRes.ok) {
        const subjectsData = await subjectsRes.json();
        setSubjects(subjectsData);
      }
    } catch (error) {
      toast.error('Ошибка загрузки данных');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (teacher?: any) => {
    if (teacher) {
      setEditingTeacher(teacher);
      setFormData({
        fullName: teacher.fullName,
        department: teacher.department,
        position: teacher.position || '',
        bio: teacher.bio || '',
        academicDegree: teacher.academicDegree || '',
        photoUrl: teacher.photoUrl || '',
        subjectIds: teacher.subjects?.map((s: any) => s.subjectId) || [],
        isActive: teacher.isActive,
      });
    } else {
      setEditingTeacher(null);
      setFormData({
        fullName: '',
        department: '',
        position: '',
        bio: '',
        academicDegree: '',
        photoUrl: '',
        subjectIds: [],
        isActive: true,
      });
    }
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.department) {
      toast.error('Заполните обязательные поля');
      return;
    }

    setIsSubmitting(true);

    try {
      const url = editingTeacher
        ? `/api/teachers/${editingTeacher.id}`
        : '/api/teachers';
      const method = editingTeacher ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка сохранения');
      }

      toast.success(
        editingTeacher
          ? 'Преподаватель обновлен'
          : 'Преподаватель добавлен'
      );
      setShowDialog(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить преподавателя?')) return;

    try {
      const response = await fetch(`/api/teachers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка удаления');
      }

      toast.success('Преподаватель удален');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка размера файла (макс 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Файл слишком большой. Максимум 2MB');
      return;
    }

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      toast.error('Можно загружать только изображения');
      return;
    }

    setUploadingPhoto(true);

    try {
      // Конвертируем в base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        // Здесь можно использовать Supabase Storage или сохранить как есть
        // Для простоты сейчас сохраняем base64
        setFormData((prev) => ({ ...prev, photoUrl: base64 }));
        toast.success('Фото загружено');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Ошибка загрузки фото');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubjectToggle = (subjectId: string) => {
    setFormData((prev) => ({
      ...prev,
      subjectIds: prev.subjectIds.includes(subjectId)
        ? prev.subjectIds.filter((id) => id !== subjectId)
        : [...prev.subjectIds, subjectId],
    }));
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Загрузка...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Управление преподавателями</h1>
          <p className="text-gray-600">Добавление и редактирование профилей преподавателей</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus size={20} className="mr-2" />
          Добавить преподавателя
        </Button>
      </div>

      <div className="grid gap-4">
        {teachers.map((teacher) => (
          <Card key={teacher.id} className="p-4">
            <div className="flex items-center gap-4">
              {teacher.photoUrl && (
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                  <Image
                    src={teacher.photoUrl}
                    alt={teacher.fullName}
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold">{teacher.fullName}</h3>
                <p className="text-sm text-gray-600">{teacher.department}</p>
                {teacher.position && (
                  <p className="text-sm text-gray-500">{teacher.position}</p>
                )}
                <div className="flex gap-2 mt-1">
                  <span className="text-sm">
                    ⭐ {teacher.averageRating.toFixed(1)} ({teacher.totalRatings})
                  </span>
                  {!teacher.isActive && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                      Неактивен
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`/teachers/${teacher.id}`, '_blank')}
                >
                  <Eye size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenDialog(teacher)}
                >
                  <Edit size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(teacher.id)}
                >
                  <Trash2 size={16} className="text-red-500" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Диалог добавления/редактирования */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTeacher ? 'Редактировать' : 'Добавить'} преподавателя
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                ФИО <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.fullName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                }
                placeholder="Иванов Иван Иванович"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Кафедра <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.department}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, department: e.target.value }))
                }
                placeholder="Анатомия"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Должность</label>
              <Input
                value={formData.position}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, position: e.target.value }))
                }
                placeholder="Профессор, доцент, ассистент..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Ученая степень</label>
              <Input
                value={formData.academicDegree}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, academicDegree: e.target.value }))
                }
                placeholder="д.м.н., к.м.н..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Биография</label>
              <Textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bio: e.target.value }))
                }
                placeholder="Краткая информация о преподавателе..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Фото</label>
              {formData.photoUrl && (
                <div className="mb-2">
                  <Image
                    src={formData.photoUrl}
                    alt="Preview"
                    width={100}
                    height={100}
                    className="rounded object-cover"
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
                className="block w-full text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Максимум 2MB</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Предметы</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-2">
                {subjects.map((subject) => (
                  <label key={subject.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.subjectIds.includes(subject.id)}
                      onChange={() => handleSubjectToggle(subject.id)}
                    />
                    <span className="text-sm">{subject.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                }
              />
              <label htmlFor="isActive" className="text-sm">
                Активный профиль
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowDialog(false)}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
