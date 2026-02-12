'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Shuffle, BookOpen, Calendar, Clock, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function QuizResultsListClient() {
  const router = useRouter();
  const [results, setResults] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMode, setSelectedMode] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [selectedMode]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedMode) params.append('mode', selectedMode);

      const [resultsRes, statsRes] = await Promise.all([
        fetch(`/api/quiz/my-results?${params}`),
        fetch('/api/quiz/stats')
      ]);

      if (resultsRes.ok) {
        const data = await resultsRes.json();
        setResults(data.attempts);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Ошибка загрузки результатов');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900';
    return 'bg-red-100 dark:bg-red-900';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Загрузка результатов...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Общая статистика */}
      {stats && stats.completedAttempts > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Всего попыток</p>
                <p className="text-2xl font-bold dark:text-white">{stats.completedAttempts}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Средний балл</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.averageScore.toFixed(1)}%
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 md:col-span-2">
            <p className="text-sm font-medium mb-3">Статистика по предметам:</p>
            <div className="space-y-2">
              {stats.statsBySubject.slice(0, 3).map((stat: any) => (
                <div key={stat.subjectId} className="flex justify-between text-sm">
                  <span className="text-gray-600">{stat.subjectName}</span>
                  <span className="font-medium">
                    {stat.averageScore.toFixed(1)}% ({stat.attempts})
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Фильтры */}
      <Tabs value={selectedMode} onValueChange={setSelectedMode} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="">
            Все тесты
          </TabsTrigger>
          <TabsTrigger value="RANDOM_30">
            <Shuffle className="w-4 h-4 mr-2" />
            Быстрые тесты
          </TabsTrigger>
          <TabsTrigger value="BLOCK">
            <BookOpen className="w-4 h-4 mr-2" />
            Блоки
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Список результатов */}
      {results.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">
            {selectedMode 
              ? 'Нет результатов для выбранного фильтра'
              : 'Вы еще не проходили тесты. Начните с выбора теста!'}
          </p>
          {results.length === 0 && !selectedMode && (
            <Button 
              onClick={() => router.push('/ct')}
              className="mt-4"
            >
              Перейти к тестам
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {results.map((attempt) => {
            const timeMinutes = Math.floor(attempt.timeSpent / 60);
            const timeSeconds = attempt.timeSpent % 60;

            return (
              <Card key={attempt.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {attempt.mode === 'RANDOM_30' ? (
                        <Shuffle className="w-5 h-5 text-blue-600" />
                      ) : (
                        <BookOpen className="w-5 h-5 text-purple-600" />
                      )}
                      <h3 className="font-semibold text-lg">
                        {attempt.block?.title || attempt.subject?.name || 'Тест'}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded font-medium ${getScoreBg(attempt.score)} ${getScoreColor(attempt.score)}`}>
                        {attempt.score.toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(attempt.completedAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {timeMinutes}:{timeSeconds.toString().padStart(2, '0')}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-4 text-sm">
                      <span className="text-green-600 font-medium">
                        ✓ {attempt.correctAnswers} правильных
                      </span>
                      <span className="text-red-600 font-medium">
                        ✗ {attempt.wrongAnswers} неправильных
                      </span>
                      {attempt.skippedAnswers > 0 && (
                        <span className="text-gray-500">
                          − {attempt.skippedAnswers} пропущено
                        </span>
                      )}
                      <span className="text-gray-600">
                        из {attempt.totalQuestions} вопросов
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => router.push(`/ct/result/${attempt.id}`)}
                    variant="outline"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Подробнее
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
