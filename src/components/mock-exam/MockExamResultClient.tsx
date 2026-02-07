'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, RefreshCw, Home, TrendingUp, Target, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  questionText: string;
  questionType: 'SINGLE' | 'MULTIPLE';
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string | null;
  correctAnswer: string;
}

interface Answer {
  questionId: string;
  userAnswer: string | null;
  isCorrect: boolean;
  question: Question;
}

interface AttemptResult {
  id: string;
  mode: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedAnswers: number;
  score: number;
  isCompleted: boolean;
  completedAt: string;
  timeSpent: number | null;
  subject?: {
    id: string;
    name: string;
    slug: string;
  };
  block?: {
    id: string;
    title: string;
  };
  answers: Answer[];
}

interface MockExamResultClientProps {
  attemptId: string;
}

export default function MockExamResultClient({ attemptId }: MockExamResultClientProps) {
  const router = useRouter();
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [retaking, setRetaking] = useState(false);

  useEffect(() => {
    fetchResult();
  }, [attemptId]);

  async function fetchResult() {
    try {
      const response = await fetch(`/api/quiz/attempt/${attemptId}`);
      if (!response.ok) throw new Error('Failed to fetch result');
      
      const data = await response.json();
      
      if (!data.isCompleted) {
        router.push(`/mock-exam/take/${attemptId}`);
        return;
      }
      
      setResult(data);
    } catch (error) {
      console.error('Error fetching result:', error);
      toast.error('Не удалось загрузить результаты');
      router.push('/mock-exam');
    } finally {
      setLoading(false);
    }
  }

  const handleRetake = async () => {
    if (!result) return;
    
    setRetaking(true);
    
    try {
      const response = await fetch('/api/quiz/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: result.mode,
          subjectId: result.subject?.id,
          blockId: result.block?.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to start new test');
      
      const data = await response.json();
      router.push(`/mock-exam/take/${data.attemptId}`);
    } catch (error) {
      console.error('Error retaking test:', error);
      toast.error('Не удалось начать новую попытку');
    } finally {
      setRetaking(false);
    }
  };

  const getOptionLabel = (key: string): string => {
    return key.toUpperCase();
  };

  const getOptionText = (question: Question, key: string): string => {
    const optionMap: Record<string, string> = {
      'a': question.optionA,
      'b': question.optionB,
      'c': question.optionC,
      'd': question.optionD,
      'e': question.optionE || '',
    };
    return optionMap[key.toLowerCase()] || '';
  };

  if (loading) {
    return <div className="text-center py-8">Загрузка результатов...</div>;
  }

  if (!result) {
    return <div className="text-center py-8">Результаты не найдены</div>;
  }

  const scoreColor = 
    result.score >= 80 ? 'text-green-600' :
    result.score >= 60 ? 'text-yellow-600' :
    'text-red-600';

  const scoreMessage = 
    result.score >= 80 ? 'Отлично! 🎉' :
    result.score >= 60 ? 'Хорошо! 👍' :
    'Нужно подтянуть 📚';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Результаты теста</h1>
        <p className="text-gray-600">
          {result.subject?.name || 'Тест'} 
          {result.block && ` - ${result.block.title}`}
        </p>
      </div>

      {/* Score Card */}
      <Card className="border-2">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-4xl font-bold">
            <span className={scoreColor}>{result.score.toFixed(1)}%</span>
          </CardTitle>
          <p className="text-xl text-gray-600 mt-2">{scoreMessage}</p>
        </CardHeader>
        <CardContent>
          <Progress value={result.score} className="h-3 mb-6" />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Target className="w-6 h-6 mx-auto mb-2 text-gray-600" />
              <p className="text-2xl font-bold">{result.totalQuestions}</p>
              <p className="text-sm text-gray-600">Всего вопросов</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-green-600">{result.correctAnswers}</p>
              <p className="text-sm text-gray-600">Правильных</p>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <XCircle className="w-6 h-6 mx-auto mb-2 text-red-600" />
              <p className="text-2xl font-bold text-red-600">{result.wrongAnswers}</p>
              <p className="text-sm text-gray-600">Неправильных</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Clock className="w-6 h-6 mx-auto mb-2 text-gray-600" />
              <p className="text-2xl font-bold">
                {result.timeSpent ? Math.floor(result.timeSpent / 60) : '-'}
              </p>
              <p className="text-sm text-gray-600">Минут</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions Review */}
      <Card>
        <CardHeader>
          <CardTitle>Детальный обзор ответов</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.answers.map((answer, index) => {
            const question = answer.question;
            const userAnswers = answer.userAnswer ? answer.userAnswer.split(',') : [];
            const correctAnswers = question.correctAnswer.split(',');
            
            return (
              <div
                key={answer.questionId}
                className={cn(
                  'p-4 rounded-lg border-2',
                  answer.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Вопрос {index + 1}</span>
                    <span className={cn(
                      'text-xs px-2 py-1 rounded-full',
                      question.questionType === 'SINGLE' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    )}>
                      {question.questionType === 'SINGLE' ? 'Один ответ' : 'Несколько'}
                    </span>
                  </div>
                  {answer.isCorrect ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  )}
                </div>
                
                <p className="text-gray-900 mb-3 font-medium">{question.questionText}</p>
                
                <div className="space-y-2 text-sm">
                  {!answer.userAnswer && (
                    <p className="text-gray-600 italic">Вопрос пропущен</p>
                  )}
                  
                  {answer.userAnswer && (
                    <div>
                      <span className="text-gray-600">Ваш ответ: </span>
                      <span className={answer.isCorrect ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
                        {userAnswers.map(a => `${getOptionLabel(a)}) ${getOptionText(question, a)}`).join(', ')}
                      </span>
                    </div>
                  )}
                  
                  {!answer.isCorrect && (
                    <div>
                      <span className="text-gray-600">Правильный ответ: </span>
                      <span className="text-green-700 font-semibold">
                        {correctAnswers.map(a => `${getOptionLabel(a)}) ${getOptionText(question, a)}`).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          variant="outline"
          size="lg"
          onClick={() => router.push('/mock-exam')}
          className="gap-2"
        >
          <Home className="w-4 h-4" />
          К дисциплинам
        </Button>
        
        <Button
          size="lg"
          onClick={handleRetake}
          disabled={retaking}
          className="gap-2"
        >
          <RefreshCw className={cn('w-4 h-4', retaking && 'animate-spin')} />
          {retaking ? 'Загрузка...' : 'Пересдать тест'}
        </Button>
      </div>
    </div>
  );
}
