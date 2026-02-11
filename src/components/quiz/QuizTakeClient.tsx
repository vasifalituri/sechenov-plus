'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface QuizTakeClientProps {
  attemptId: string;
}

export default function QuizTakeClient({ attemptId }: QuizTakeClientProps) {
  const router = useRouter();
  const [quiz, setQuiz] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    // Таймер
    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  useEffect(() => {
    // Предупреждение при попытке покинуть страницу
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (!attemptId || attemptId === 'undefined' || attemptId === 'null') {
      setIsLoading(false);
      setLoadError('Тест не найден: отсутствует идентификатор попытки');
      return;
    }

    fetchQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const fetchQuiz = async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      // Здесь нужно получить вопросы из состояния или localStorage
      // так как API /api/quiz/start уже вызван на предыдущей странице
      const cachedQuiz = localStorage.getItem(`quiz_${attemptId}`);
      if (cachedQuiz) {
        setQuiz(JSON.parse(cachedQuiz));
        return;
      }

      // Fallback: load from server (works after refresh / opening link on another device)
      // Neon can have a short read-after-write delay (especially with pooling/replicas),
      // so we retry for a bit longer before declaring the attempt missing.
      let lastStatus: number | null = null;
      let lastDetails = '';

      const maxAttempts = 8; // ~0.3 + 0.6 + 1.2 + 2 + 2 + 2 + 2 + 2 = ~14s
      for (let i = 0; i < maxAttempts; i++) {
        const res = await fetch(`/api/quiz/take/${attemptId}`, {
          cache: 'no-store',
          headers: { 'cache-control': 'no-store' },
        });

        if (res.ok) {
          const data = await res.json();
          localStorage.setItem(`quiz_${attemptId}`, JSON.stringify(data));
          setQuiz(data);
          return;
        }

        lastStatus = res.status;
        try {
          lastDetails = await res.text();
        } catch {
          lastDetails = '';
        }

        // Unauthorized: stop retrying
        if (res.status === 401) {
          break;
        }

        // Retry only on 404 (attempt not visible yet)
        if (res.status !== 404) {
          break;
        }

        // backoff (cap at 2000ms)
        const delay = Math.min(300 * Math.pow(2, i), 2000);
        await sleep(delay);
      }

      const msg = `Тест не найден (HTTP ${lastStatus ?? '???'})`;
      setLoadError(lastDetails ? `${msg}: ${lastDetails}` : msg);
      // Do not auto-redirect; user can retry.
      toast.error(msg);
      return;
    } catch (error) {
      console.error('Error loading quiz:', error);
      setLoadError('Ошибка загрузки теста');
      toast.error('Ошибка загрузки теста');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < quiz.questions.length) {
      if (!confirm(`Вы ответили на ${Object.keys(answers).length} из ${quiz.questions.length} вопросов. Отправить тест?`)) {
        return;
      }
    }

    try {
      setIsSubmitting(true);

      const answersArray = quiz.questions.map((q: any) => ({
        questionId: q.id,
        userAnswer: answers[q.id] || null,
        timeSpent: null
      }));

      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          answers: answersArray,
          timeSpent
        })
      });

      if (res.ok) {
        localStorage.removeItem(`quiz_${attemptId}`);
        toast.success('Тест завершен!');
        router.push(`/ct/result/${attemptId}`);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Ошибка отправки');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Ошибка отправки теста');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!quiz) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center max-w-xl">
          {isLoading && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Подготавливаем тест...</p>
            </>
          )}

          {!isLoading && loadError && (
            <>
              <p className="text-red-600 font-medium mb-2">Не удалось открыть тест</p>
              <p className="text-sm text-gray-600 mb-4 break-words">{loadError}</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={fetchQuiz}>Повторить</Button>
                <Button variant="outline" onClick={() => router.push('/ct')}>
                  Назад
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentIndex];
  const progress = ((currentIndex + 1) / quiz.totalQuestions) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Хедер с прогрессом */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm text-gray-600">
              Вопрос {currentIndex + 1} из {quiz.totalQuestions}
            </p>
            <p className="text-sm text-gray-500">
              Отвечено: {answeredCount} / {quiz.totalQuestions}
            </p>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span className="font-mono">
              {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>

      {/* Вопрос */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {currentQuestion.questionText}
          </h2>
          
          {currentQuestion.questionImage && (
            <img
              src={currentQuestion.questionImage}
              alt="Иллюстрация к вопросу"
              className="max-w-full h-auto rounded-lg mb-4"
            />
          )}
        </div>

        <div className="space-y-3">
          {['A', 'B', 'C', 'D', 'E'].map((option) => {
            const text = currentQuestion[`option${option}`];
            if (!text) return null;

            const isSelected = answers[currentQuestion.id] === option;

            return (
              <button
                key={option}
                onClick={() => handleAnswer(currentQuestion.id, option)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                  <div>
                    <span className="font-medium">{option})</span>
                    <span className="ml-2">{text}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Навигация */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>

        <div className="flex gap-2">
          {currentIndex < quiz.questions.length - 1 ? (
            <Button
              onClick={() => setCurrentIndex(prev => Math.min(quiz.questions.length - 1, prev + 1))}
            >
              Далее
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Отправка...' : 'Завершить тест'}
            </Button>
          )}
        </div>
      </div>

      {/* Карта вопросов */}
      <Card className="p-4">
        <p className="text-sm font-medium mb-3">Навигация по вопросам:</p>
        <div className="grid grid-cols-10 gap-2">
          {quiz.questions.map((_: any, idx: number) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                idx === currentIndex
                  ? 'bg-blue-600 text-white'
                  : answers[quiz.questions[idx].id]
                  ? 'bg-green-100 text-green-700 border-2 border-green-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
