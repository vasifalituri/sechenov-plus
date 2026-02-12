'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BookOpen, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface Subject {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  _count?: {
    quizBlocks: number;
    quizQuestions: number;
  };
}

export default function CTSubjectsClient() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    void fetchSubjects();
  }, []);

  async function fetchSubjects() {
    try {
      const response = await fetch('/api/subjects');
      if (!response.ok) throw new Error('Failed to fetch subjects');

      const data = await response.json();
      const subjectsWithQuestions = (Array.isArray(data) ? data : data.data).filter(
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

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            </CardHeader>
            <CardContent>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Фильтруем предметы по поиску
  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (subjects.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Дисциплины не найдены</h3>
            <p className="text-gray-600">Пока нет доступных дисциплин с вопросами.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Поле поиска */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Поиск по названию дисциплины..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 py-2 h-10"
        />
      </div>

      {/* Результаты поиска */}
      {filteredSubjects.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ничего не найдено</h3>
              <p className="text-gray-600">Попробуйте изменить запрос для поиска дисциплин.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((subject) => (
            <Card
              key={subject.id}
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => {
                const value = (subject.slug && subject.slug.trim()) || subject.id;
                router.push(`/ct/${encodeURIComponent(value)}`);
              }}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="group-hover:text-blue-600 transition-colors">{subject.name}</span>
                  <BookOpen className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </CardTitle>
                <CardDescription>
                  {subject.description || 'Подготовка к централизованному тестированию'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Всего вопросов:</span>
                  <span className="font-semibold">{subject._count?.quizQuestions || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Тематических блоков:</span>
                  <span className="font-semibold">{subject._count?.quizBlocks || 0}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
