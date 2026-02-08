'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Zap, BookOpen, Clock, Target } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Subject {
  id: string;
  name: string;
  slug: string;
  _count?: {
    quizBlocks: number;
    quizQuestions: number;
  };
}

interface QuizBlock {
  id: string;
  title: string;
  description: string | null;
  questionCount: number;
  difficulty: string;
}

interface MockExamModeSelectorProps {
  subjectSlug: string;
}

export default function MockExamModeSelector({ subjectSlug }: MockExamModeSelectorProps) {
  const router = useRouter();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [blocks, setBlocks] = useState<QuizBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [subjectSlug]);

  async function fetchData() {
    try {
      // Fetch subjects
      const subjectsResponse = await fetch('/api/subjects');
      if (!subjectsResponse.ok) throw new Error('Failed to fetch subjects');
      
      const subjects = await subjectsResponse.json();
      const foundSubject = subjects.find((s: Subject) => s.slug === subjectSlug);
      
      if (!foundSubject) {
        toast.error('Дисциплина не найдена');
        router.push('/ct');
        return;
      }
      
      setSubject(foundSubject);

      // Fetch quiz blocks
      const blocksResponse = await fetch(`/api/quiz/blocks?subjectId=${foundSubject.id}`);
      if (blocksResponse.ok) {
        const blocksData = await blocksResponse.json();
        setBlocks(blocksData.blocks || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }

  const handleQuickTest = async () => {
    if (!subject) return;
    
    try {
      const response = await fetch('/api/quiz/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'RANDOM_30',
          subjectId: subject.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to start test');
      
      const data = await response.json();
      router.push(`/ct/take/${data.attemptId}`);
    } catch (error) {
      console.error('Error starting test:', error);
      toast.error('Не удалось начать тест');
    }
  };

  const handleBlockTest = async (blockId: string) => {
    try {
      const response = await fetch('/api/quiz/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'BLOCK',
          blockId: blockId,
        }),
      });

      if (!response.ok) throw new Error('Failed to start test');
      
      const data = await response.json();
      router.push(`/ct/take/${data.attemptId}`);
    } catch (error) {
      console.error('Error starting test:', error);
      toast.error('Не удалось начать тест');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  if (!subject) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/mock-exam">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к дисциплинам
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{subject.name}</h1>
          <p className="text-gray-600 mt-2">
            Выберите режим тестирования
          </p>
        </div>
      </div>

      {/* Quick Test Mode */}
      <Card className="border-2 hover:border-blue-500 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            Быстрый тест
          </CardTitle>
          <CardDescription>
            30 случайных вопросов для быстрой проверки знаний
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" />
              <span>30 вопросов</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-500" />
              <span>~15-20 минут</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>Случайная выборка</span>
            </div>
          </div>
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleQuickTest}
            disabled={!subject._count?.quizQuestions || subject._count.quizQuestions < 30}
          >
            Начать быстрый тест
          </Button>
          {subject._count && subject._count.quizQuestions < 30 && (
            <p className="text-sm text-red-500 text-center">
              Недостаточно вопросов (минимум 30 требуется)
            </p>
          )}
        </CardContent>
      </Card>

      {/* Block Tests */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Тематические блоки
        </h2>
        
        {blocks.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-600">
              Тематические блоки пока не созданы
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {blocks.map((block) => (
              <Card key={block.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{block.title}</CardTitle>
                  <CardDescription>{block.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Вопросов:</span>
                    <span className="font-semibold">{block.questionCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Сложность:</span>
                    <span className={`font-semibold ${
                      block.difficulty === 'EASY' ? 'text-green-600' :
                      block.difficulty === 'HARD' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {block.difficulty === 'EASY' ? 'Легкий' :
                       block.difficulty === 'HARD' ? 'Сложный' : 'Средний'}
                    </span>
                  </div>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => handleBlockTest(block.id)}
                  >
                    Начать тест
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
