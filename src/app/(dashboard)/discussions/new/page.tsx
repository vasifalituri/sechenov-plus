'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SubjectSelect } from '@/components/ui/subject-select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewDiscussionPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    subjectId: '',
  });

  useEffect(() => {
    fetch('/api/subjects')
      .then((res) => res.json())
      .then((data) => setSubjects(data.data || []))
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subjectId) {
      setError('Заполните все обязательные поля');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          academicYear: session?.user?.academicYear || 1, // Use user's academic year
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // Перенаправляем на созданное обсуждение
        setTimeout(() => {
          router.push(`/discussions/${data.data.id}`);
        }, 1500);
      } else {
        setError(data.error || 'Ошибка создания темы');
      }
    } catch (err) {
      setError('Произошла ошибка при создании темы');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-green-600">Обсуждение создано!</CardTitle>
          <CardDescription>
            Перенаправление на страницу обсуждения...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/discussions">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад к обсуждениям
        </Button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold">Создать обсуждение</h1>
        <p className="text-muted-foreground mt-2">
          Поделитесь опытом сдачи экзаменов или задайте вопрос
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Новая тема</CardTitle>
          <CardDescription>
            Создайте новое обсуждение и делитесь опытом с другими студентами
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Заголовок *</Label>
              <Input
                id="title"
                placeholder="Например: Что было на экзамене по анатомии?"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Предмет *</Label>
              <SubjectSelect
                value={formData.subjectId}
                onChange={(value) => setFormData({ ...formData, subjectId: value })}
                subjects={subjects}
                placeholder="Выберите предмет..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Описание *</Label>
              <Textarea
                id="content"
                placeholder="Расскажите подробно о вашем опыте или вопросе..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
                disabled={isLoading}
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                Поделитесь деталями: какие темы были на экзамене, как проходил опрос, что важно знать
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Создание...' : 'Создать тему'}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
