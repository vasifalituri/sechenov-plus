'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, ChevronLeft, ChevronRight, CheckCircle, Flag, AlertCircle } from 'lucide-react';
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
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
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
    console.log('🎯 [QuizTakeClient] Component mounted with attemptId:', attemptId, 'type:', typeof attemptId);
    
    if (!attemptId || attemptId === 'undefined' || attemptId === 'null') {
      console.error('❌ [QuizTakeClient] Invalid attemptId:', attemptId);
      setIsLoading(false);
      setLoadError('Тест не найден: отсутствует идентификатор попытки');
      return;
    }

    fetchQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const fetchQuiz = async () => {
    console.log('📥 [QuizTakeClient] fetchQuiz called for attemptId:', attemptId);
    setIsLoading(true);
    setLoadError(null);

    try {
      // Здесь нужно получить вопросы из состояния или localStorage
      // так как API /api/quiz/start уже вызван на предыдущей странице
      const cachedQuiz = localStorage.getItem(`quiz_${attemptId}`);
      console.log('💾 [QuizTakeClient] localStorage check:', cachedQuiz ? 'FOUND' : 'NOT FOUND');
      
      if (cachedQuiz) {
        console.log('✅ [QuizTakeClient] Loading from localStorage');
        setQuiz(JSON.parse(cachedQuiz));
        
        // Загружаем ответы из localStorage
        const savedAnswers = localStorage.getItem(`quiz_answers_${attemptId}`);
        if (savedAnswers) {
          try {
            const answersObj = JSON.parse(savedAnswers);
            setAnswers(answersObj);
            console.log('✅ [QuizTakeClient] Loaded saved answers:', Object.keys(answersObj).length);
          } catch (e) {
            console.error('Error loading answers:', e);
          }
        }
        
        // Загружаем отметки из localStorage
        const savedFlags = localStorage.getItem(`quiz_flags_${attemptId}`);
        if (savedFlags) {
          try {
            const flagsArray = JSON.parse(savedFlags);
            setFlaggedQuestions(new Set(flagsArray));
            console.log('✅ [QuizTakeClient] Loaded saved flags:', flagsArray.length);
          } catch (e) {
            console.error('Error loading flags:', e);
          }
        }
        
        setIsLoading(false);
        return;
      }
      
      console.log('🌐 [QuizTakeClient] No cache, fetching from API...');

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
          
          // Загружаем ответы из localStorage
          const savedAnswers = localStorage.getItem(`quiz_answers_${attemptId}`);
          if (savedAnswers) {
            try {
              const answersObj = JSON.parse(savedAnswers);
              setAnswers(answersObj);
              console.log('✅ [QuizTakeClient] Loaded saved answers after server fetch:', Object.keys(answersObj).length);
            } catch (e) {
              console.error('Error loading answers:', e);
            }
          }
          
          // Загружаем отметки из localStorage
          const savedFlags = localStorage.getItem(`quiz_flags_${attemptId}`);
          if (savedFlags) {
            try {
              const flagsArray = JSON.parse(savedFlags);
              setFlaggedQuestions(new Set(flagsArray));
              console.log('✅ [QuizTakeClient] Loaded saved flags after server fetch:', flagsArray.length);
            } catch (e) {
              console.error('Error loading flags:', e);
            }
          }
          
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
    setAnswers(prev => {
      const newAnswers = {
        ...prev,
        [questionId]: answer
      };
      // Сохраняем ответы в localStorage при каждом изменении
      localStorage.setItem(`quiz_answers_${attemptId}`, JSON.stringify(newAnswers));
      return newAnswers;
    });
  };

  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
        toast.success('Отметка снята');
      } else {
        newSet.add(questionId);
        toast.success('Вопрос отмечен для проверки');
      }
      // Сохраняем в localStorage
      localStorage.setItem(`quiz_flags_${attemptId}`, JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  const goToNextFlagged = () => {
    const flaggedArray = Array.from(flaggedQuestions);
    if (flaggedArray.length === 0) {
      toast.error('Нет отмеченных вопросов');
      return;
    }
    
    // Найти следующий отмеченный вопрос после текущего
    const currentQuestionId = quiz.questions[currentIndex].id;
    const currentFlaggedIndex = flaggedArray.indexOf(currentQuestionId);
    
    let nextFlaggedId;
    if (currentFlaggedIndex === -1 || currentFlaggedIndex === flaggedArray.length - 1) {
      // Если текущий не отмечен или это последний отмеченный - берем первый
      nextFlaggedId = flaggedArray[0];
    } else {
      nextFlaggedId = flaggedArray[currentFlaggedIndex + 1];
    }
    
    const nextIndex = quiz.questions.findIndex((q: any) => q.id === nextFlaggedId);
    if (nextIndex !== -1) {
      setCurrentIndex(nextIndex);
    }
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
        // Очищаем localStorage после успешного сабмита
        localStorage.removeItem(`quiz_${attemptId}`);
        localStorage.removeItem(`quiz_answers_${attemptId}`);
        localStorage.removeItem(`quiz_flags_${attemptId}`);
        console.log('✅ [QuizTakeClient] Cleared quiz data from localStorage');
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
          <div className="flex items-center gap-4">
            {flaggedQuestions.size > 0 && (
              <button
                onClick={goToNextFlagged}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-50 border border-yellow-300 text-yellow-700 hover:bg-yellow-100 transition-colors text-sm"
              >
                <Flag className="w-4 h-4 fill-yellow-500" />
                <span>Отмечено: {flaggedQuestions.size}</span>
              </button>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span className="font-mono">
                {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
              </span>
            </div>
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
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-xl font-semibold flex-1">
              {currentQuestion.questionText}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleFlag(currentQuestion.id)}
              className={`ml-4 ${
                flaggedQuestions.has(currentQuestion.id)
                  ? 'bg-yellow-50 border-yellow-500 text-yellow-700 hover:bg-yellow-100'
                  : 'hover:bg-gray-50'
              }`}
            >
              <Flag
                className={`w-4 h-4 mr-2 ${
                  flaggedQuestions.has(currentQuestion.id) ? 'fill-yellow-500' : ''
                }`}
              />
              {flaggedQuestions.has(currentQuestion.id) ? 'Отмечен' : 'Отметить'}
            </Button>
          </div>
          
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
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 dark:text-blue-100'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500 dark:bg-blue-600 dark:border-blue-400'
                      : 'border-gray-300 dark:border-gray-600'
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
          {quiz.questions.map((q: any, idx: number) => {
            const isFlagged = flaggedQuestions.has(q.id);
            const isAnswered = answers[q.id];
            const isCurrent = idx === currentIndex;
            
            return (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all relative ${
                  isCurrent
                    ? 'bg-blue-600 text-white dark:bg-blue-700 dark:text-white'
                    : isAnswered
                    ? 'bg-green-100 text-green-700 border-2 border-green-300 dark:bg-green-900 dark:text-green-100 dark:border-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {idx + 1}
                {isFlagged && (
                  <Flag className="w-3 h-3 fill-yellow-500 text-yellow-500 absolute -top-1 -right-1" />
                )}
              </button>
            );
          })}
        </div>
        
        {/* Легенда */}
        <div className="flex gap-4 mt-4 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-blue-600 dark:bg-blue-700 rounded"></div>
            <span>Текущий</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-300 dark:bg-green-900 dark:border-green-700 rounded"></div>
            <span>Отвечен</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-gray-100 dark:bg-gray-700 rounded"></div>
            <span>Не отвечен</span>
          </div>
          <div className="flex items-center gap-1">
            <Flag className="w-4 h-4 fill-yellow-500 text-yellow-500" />
            <span>Отмечен</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
