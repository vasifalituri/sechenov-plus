'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

interface Subject {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count?: {
    quizBlocks: number;
    quizQuestions: number;
  };
}

export default function CTSubjectModeClient({
  subjectSlug,
}: {
  subjectSlug?: string;
}) {
  const router = useRouter();
  const rawSlug = typeof subjectSlug === 'string' ? subjectSlug : '';
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingQuick, setStartingQuick] = useState(false);

  const normalizedSlug = useMemo(() => {
    // Next.js params are usually already decoded, but we guard against double-decoding
    if (!rawSlug) return '';
    try {
      return decodeURIComponent(rawSlug).trim().toLowerCase();
    } catch {
      return rawSlug.trim().toLowerCase();
    }
  }, [rawSlug]);

  useEffect(() => {
    void loadSubject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedSlug]);

  async function loadSubject() {
    setLoading(true);
    try {
      if (!rawSlug) {
        toast.error('Не передан параметр дисциплины');
        router.push('/ct');
        return;
      }

      const res = await fetch(`/api/subjects?slug=${encodeURIComponent(rawSlug)}`);
      if (res.status === 404) {
        toast.error('Дисциплина не найдена');
        router.push('/ct');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch subject');

      const found: Subject = await res.json();
      setSubject(found);
    } catch (e) {
      console.error(e);
      toast.error('Не удалось загрузить дисциплину');
    } finally {
      setLoading(false);
    }
  }

  const startQuickTest = async () => {
    if (!subject) return;
    if (!subject._count?.quizQuestions || subject._count.quizQuestions < 30) {
      toast.error('Недостаточно вопросов для быстрого теста (минимум 30)');
      return;
    }

    setStartingQuick(true);
    try {
      const response = await fetch('/api/quiz/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'RANDOM_30', subjectId: subject.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start test');
      }

      const data = await response.json();
      localStorage.setItem(`quiz_${data.attemptId}`, JSON.stringify(data));
      router.push(`/ct/take/${data.attemptId}`);
    } catch (error: any) {
      console.error('Error starting quick test:', error);
      toast.error(error.message || 'Не удалось начать быстрый тест');
    } finally {
      setStartingQuick(false);
    }
  };

  if (loading || !subject) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-gray-600">Загрузка...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{subject.name}</h1>
        <p className="text-gray-600 mt-2">Выберите режим подготовки</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Быстрый тест
            </CardTitle>
            <CardDescription>30 случайных вопросов по дисциплине</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Доступно вопросов: <span className="font-semibold">{subject._count?.quizQuestions || 0}</span>
            </div>
            <Button
              className="w-full"
              onClick={startQuickTest}
              disabled={startingQuick || !subject._count?.quizQuestions || subject._count.quizQuestions < 30}
            >
              {startingQuick ? 'Запуск...' : 'Начать быстрый тест'}
            </Button>
            {subject._count && subject._count.quizQuestions < 30 && (
              <p className="text-xs text-red-500 text-center">Минимум 30 вопросов для этого режима</p>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Тематические блоки
            </CardTitle>
            <CardDescription>Подготовка по конкретным темам</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Доступно блоков: <span className="font-semibold">{subject._count?.quizBlocks || 0}</span>
            </div>
            <Button className="w-full" variant="outline" onClick={() => router.push(`/ct/${subject.slug}/blocks`)}>
              Открыть блоки
            </Button>
          </CardContent>
        </Card>
      </div>

      <div>
        <Button variant="ghost" onClick={() => router.push('/ct')}>
          Назад к дисциплинам
        </Button>
      </div>
    </div>
  );
}
