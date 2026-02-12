'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Award, ArrowLeft, RefreshCw, Lightbulb, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface QuizResultClientProps {
  attemptId: string;
}

export default function QuizResultClient({ attemptId }: QuizResultClientProps) {
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showExplanations, setShowExplanations] = useState(true);
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({});
  const [loadingAiAnswer, setLoadingAiAnswer] = useState<string | null>(null);

  useEffect(() => {
    fetchResult();
  }, [attemptId]);

  const fetchResult = async () => {
    try {
      const res = await fetch(`/api/quiz/attempt/${attemptId}`);
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        toast.error('Результаты не найдены');
        router.push('/quiz');
      }
    } catch (error) {
      console.error('Error fetching result:', error);
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
    if (score >= 80) return 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-700 dark:text-green-100';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-700 dark:text-yellow-100';
    return 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-700 dark:text-red-100';
  };

  const getAiExplanation = async (answer: any) => {
    const answerId = answer.id;
    
    // Если уже загружали, не загружаем еще раз
    if (aiExplanations[answerId]) {
      return;
    }

    setLoadingAiAnswer(answerId);
    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionText: answer.question.questionText,
          correctAnswer: answer.question.correctAnswer,
          userAnswer: answer.userAnswer,
          explanation: answer.question.explanation,
          options: {
            A: answer.question.optionA,
            B: answer.question.optionB,
            C: answer.question.optionC,
            D: answer.question.optionD,
            E: answer.question.optionE,
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI explanation');
      }

      const data = await response.json();
      setAiExplanations(prev => ({
        ...prev,
        [answerId]: data.explanation
      }));
    } catch (error) {
      console.error('Error getting AI explanation:', error);
      toast.error('Не удалось получить объяснение от ИИ');
    } finally {
      setLoadingAiAnswer(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Загрузка результатов...</div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const timeMinutes = Math.floor(result.timeSpent / 60);
  const timeSeconds = result.timeSpent % 60;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Общий результат */}
      <Card className={`p-8 border-2 ${getScoreBg(result.score)}`}>
        <div className="text-center">
          <Award className={`w-16 h-16 mx-auto mb-4 ${getScoreColor(result.score)}`} />
          <h1 className="text-3xl font-bold mb-2">Тест завершен!</h1>
          <p className="text-xl text-gray-600 mb-6">
            {result.block?.title || result.subject?.name || 'Случайный тест'}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Ваш балл</p>
              <p className={`text-3xl font-bold ${getScoreColor(result.score)}`}>
                {result.score.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Правильно</p>
              <p className="text-3xl font-bold text-green-600">{result.correctAnswers}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Неправильно</p>
              <p className="text-3xl font-bold text-red-600">{result.wrongAnswers}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Время</p>
              <p className="text-2xl font-bold text-gray-700">
                {timeMinutes}:{timeSeconds.toString().padStart(2, '0')}
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.push('/ct')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              К тестам
            </Button>
            <Button onClick={() => router.push('/quiz/results')}>
              Все результаты
            </Button>
          </div>
        </div>
      </Card>

      {/* Переключатель объяснений */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Разбор ответов</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowExplanations(!showExplanations)}
        >
          {showExplanations ? 'Скрыть' : 'Показать'} объяснения
        </Button>
      </div>

      {/* Список вопросов с ответами */}
      <div className="space-y-4">
        {result.answers.map((answer: any, index: number) => {
          const question = answer.question;
          const isCorrect = answer.isCorrect;

          return (
            <Card key={answer.id} className={`p-6 border-l-4 ${
              isCorrect ? 'border-l-green-500' : 'border-l-red-500'
            }`}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {isCorrect ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-500">
                      Вопрос #{index + 1}
                    </span>
                    {isCorrect ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded dark:bg-green-900 dark:text-green-100">
                        Правильно
                      </span>
                    ) : (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded dark:bg-red-900 dark:text-red-100">
                        Неправильно
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">{question.questionText}</h3>

                  {question.questionImage && (
                    <img
                      src={question.questionImage}
                      alt="Иллюстрация"
                      className="max-w-md h-auto rounded-lg mb-3"
                    />
                  )}

                  <div className="space-y-2 mb-3">
                    {['A', 'B', 'C', 'D', 'E'].map((option) => {
                      const text = question[`option${option}`];
                      if (!text) return null;

                      const isUserAnswer = answer.userAnswer === option;
                      const isCorrectAnswer = question.correctAnswer === option;

                      return (
                        <div
                          key={option}
                          className={`p-3 rounded-lg border-2 ${
                            isCorrectAnswer
                              ? 'border-green-500 bg-green-50 dark:bg-green-900 dark:border-green-600'
                              : isUserAnswer
                              ? 'border-red-500 bg-red-50 dark:bg-red-900 dark:border-red-600'
                              : 'border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-gray-900 dark:text-gray-100">{option})</span>
                            <span className="flex-1 text-gray-900 dark:text-gray-100">{text}</span>
                            {isCorrectAnswer && (
                              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            )}
                            {isUserAnswer && !isCorrectAnswer && (
                              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {!answer.userAnswer && (
                    <p className="text-sm text-gray-600 italic mb-3">
                      Вы не ответили на этот вопрос
                    </p>
                  )}

                  {showExplanations && question.explanation && (
                    <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded dark:bg-blue-950 dark:border-blue-600">
                      <p className="text-sm font-medium text-blue-900 mb-1 dark:text-blue-100">
                        💡 Объяснение:
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-200">{question.explanation}</p>
                    </div>
                  )}

                  {/* AI Explanation Button and Content */}
                  <div className="mt-4">
                    <Button
                      onClick={() => getAiExplanation(answer)}
                      disabled={loadingAiAnswer === answer.id}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      {loadingAiAnswer === answer.id ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Объяснение от ИИ...
                        </>
                      ) : (
                        <>
                          <Lightbulb className="w-4 h-4" />
                          {aiExplanations[answer.id] ? 'Объяснение от ИИ' : 'Получить объяснение от ИИ'}
                        </>
                      )}
                    </Button>

                    {aiExplanations[answer.id] && (
                      <div className="mt-3 p-4 bg-purple-50 border-l-4 border-purple-500 rounded dark:bg-purple-950 dark:border-purple-600">
                        <p className="text-sm font-medium text-purple-900 mb-2 dark:text-purple-100">
                          🤖 Объяснение от ИИ:
                        </p>
                        <p className="text-sm text-purple-800 dark:text-purple-200 whitespace-pre-wrap">{aiExplanations[answer.id]}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Кнопки внизу */}
      <div className="flex gap-3 justify-center pb-8">
        <Button onClick={() => router.push('/ct')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Вернуться к тестам
        </Button>
        <Button 
          onClick={() => {
            if (result.mode === 'RANDOM_30' && result.subjectId) {
              router.push('/quiz');
            } else if (result.blockId) {
              router.push('/quiz');
            }
          }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Пройти еще раз
        </Button>
      </div>
    </div>
  );
}
