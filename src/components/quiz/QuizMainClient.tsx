'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shuffle, BookOpen, BarChart3, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function QuizMainClient() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchBlocks();
    }
  }, [selectedSubject]);

  const fetchData = async () => {
    try {
      const [subjectsRes, statsRes] = await Promise.all([
        fetch('/api/subjects'),
        fetch('/api/quiz/stats')
      ]);

      if (subjectsRes.ok) {
        const data = await subjectsRes.json();
        setSubjects(Array.isArray(data.data) ? data.data : data);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBlocks = async () => {
    try {
      const res = await fetch(`/api/quiz/blocks?subjectId=${selectedSubject}`);
      if (res.ok) {
        const data = await res.json();
        setBlocks(data);
      }
    } catch (error) {
      console.error('Error fetching blocks:', error);
    }
  };

  const startRandomQuiz = async () => {
    if (!selectedSubject) {
      toast.error('Выберите предмет');
      return;
    }

    try {
      const res = await fetch('/api/quiz/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'RANDOM_30',
          subjectId: selectedSubject
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Сохраняем данные теста в localStorage
        localStorage.setItem(`quiz_${data.attemptId}`, JSON.stringify(data));
        router.push(`/quiz/take/${data.attemptId}`);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Ошибка запуска теста');
      }
    } catch (error) {
      console.error('Error starting quiz:', error);
      toast.error('Ошибка запуска теста');
    }
  };

  const startBlockQuiz = async (blockId: string) => {
    try {
      const res = await fetch('/api/quiz/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'BLOCK',
          blockId
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Сохраняем данные теста в localStorage
        localStorage.setItem(`quiz_${data.attemptId}`, JSON.stringify(data));
        router.push(`/quiz/take/${data.attemptId}`);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Ошибка запуска теста');
      }
    } catch (error) {
      console.error('Error starting quiz:', error);
      toast.error('Ошибка запуска теста');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Статистика */}
      {stats && stats.completedAttempts > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-semibold">Ваша статистика</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Всего попыток</p>
              <p className="text-2xl font-bold">{stats.completedAttempts}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Средний балл</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.averageScore.toFixed(1)}%
              </p>
            </div>
            <div className="md:col-span-2">
              <Button
                variant="outline"
                onClick={() => router.push('/ct/results')}
                className="w-full"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Посмотреть все результаты
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Режимы тестирования */}
      <Tabs defaultValue="random" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="random">
            <Shuffle className="w-4 h-4 mr-2" />
            Быстрый тест (30 вопросов)
          </TabsTrigger>
          <TabsTrigger value="blocks">
            <BookOpen className="w-4 h-4 mr-2" />
            Тематические блоки
          </TabsTrigger>
        </TabsList>

        {/* Режим 1: Случайные 30 вопросов */}
        <TabsContent value="random" className="mt-6">
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">
                Быстрый тест: 30 случайных вопросов
              </h3>
              <p className="text-gray-600">
                Получите 30 случайных вопросов из выбранного предмета для быстрой практики
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Выберите предмет
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full max-w-md px-4 py-2 border rounded-lg"
                >
                  <option value="">Выберите предмет</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={startRandomQuiz}
                disabled={!selectedSubject}
                className="min-w-[200px]"
              >
                <Shuffle className="w-4 h-4 mr-2" />
                Начать тест
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Режим 2: Тематические блоки */}
        <TabsContent value="blocks" className="mt-6">
          <Card className="p-6 mb-4">
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">
                Тематические блоки (50-300 вопросов)
              </h3>
              <p className="text-gray-600">
                Углубленная подготовка по конкретным темам
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Выберите предмет
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full max-w-md px-4 py-2 border rounded-lg"
              >
                <option value="">Выберите предмет</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          {selectedSubject ? (
            blocks.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-500">
                  Блоки для этого предмета пока не добавлены
                </p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {blocks.map((block) => (
                  <Card key={block.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{block.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            block.difficulty === 'EASY' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-100' :
                            block.difficulty === 'HARD' ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-100' :
                            'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-100'
                          }`}>
                            {block.difficulty === 'EASY' ? 'Легкий' :
                             block.difficulty === 'HARD' ? 'Сложный' : 'Средний'}
                          </span>
                        </div>

                        {block.description && (
                          <p className="text-gray-600 mb-3">{block.description}</p>
                        )}

                        <div className="flex gap-4 text-sm text-gray-600">
                          <span>📝 {block.questionCount} вопросов</span>
                          {block.totalAttempts > 0 && (
                            <>
                              <span>👤 {block.totalAttempts} попыток</span>
                              <span>⭐ Ср. балл: {block.averageScore.toFixed(1)}%</span>
                            </>
                          )}
                        </div>

                        {block.userAttempts.length > 0 && (
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                            <p className="text-sm text-blue-900 dark:text-blue-100">
                              🏆 Ваш лучший результат: <strong>{block.bestScore.toFixed(1)}%</strong>
                              {' '}({block.totalAttempts} попыток)
                            </p>
                          </div>
                        )}
                      </div>

                      <Button onClick={() => startBlockQuiz(block.id)}>
                        Начать
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )
          ) : (
            <Card className="p-8 text-center">
              <p className="text-gray-500">
                Выберите предмет, чтобы увидеть доступные блоки
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
