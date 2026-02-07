'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, Target, TrendingUp } from 'lucide-react';
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

export default function MockExamClient() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjects();
  }, []);

  async function fetchSubjects() {
    try {
      const response = await fetch('/api/subjects');
      if (!response.ok) throw new Error('Failed to fetch subjects');
      
      const data = await response.json();
      
      // Filter only subjects that have questions
      const subjectsWithQuestions = data.filter(
        (s: Subject) => s._count && s._count.quizQuestions > 0
      );
      
      setSubjects(subjectsWithQuestions);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Не удалось загрузить дисциплины');
    } finally {
      setLoading(false);
    }
  }

  const handleSubjectClick = (subjectId: string, subjectSlug: string) => {
    router.push(`/mock-exam/${subjectSlug}`);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </CardHeader>
            <CardContent>
              <div className="h-10 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Вопросы не найдены</h3>
            <p className="text-gray-600">
              В данный момент нет доступных дисциплин для тестирования.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Доступно дисциплин</p>
                <p className="text-2xl font-bold">{subjects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Режимы тестирования</p>
                <p className="text-2xl font-bold">2</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Проверка ответов</p>
                <p className="text-2xl font-bold">✓</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <Card
            key={subject.id}
            className="hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => handleSubjectClick(subject.id, subject.slug)}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="group-hover:text-blue-600 transition-colors">
                  {subject.name}
                </span>
                <BookOpen className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </CardTitle>
              <CardDescription>
                {subject.description || 'Подготовка к централизованному тестированию'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Всего вопросов:</span>
                <span className="font-semibold">
                  {subject._count?.quizQuestions || 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Тематических блоков:</span>
                <span className="font-semibold">
                  {subject._count?.quizBlocks || 0}
                </span>
              </div>
              <Button className="w-full mt-4" variant="default">
                Начать тестирование
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
