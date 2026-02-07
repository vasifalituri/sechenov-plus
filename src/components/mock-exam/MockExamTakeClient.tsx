'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
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
}

interface AttemptData {
  id: string;
  mode: string;
  totalQuestions: number;
  isCompleted: boolean;
  questions: Question[];
  answers: Answer[];
}

interface MockExamTakeClientProps {
  attemptId: string;
}

export default function MockExamTakeClient({ attemptId }: MockExamTakeClientProps) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showAnswer, setShowAnswer] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAttempt();
  }, [attemptId]);

  async function fetchAttempt() {
    try {
      const response = await fetch(`/api/quiz/attempt/${attemptId}`);
      if (!response.ok) throw new Error('Failed to fetch attempt');
      
      const data = await response.json();
      
      if (data.isCompleted) {
        router.push(`/mock-exam/result/${attemptId}`);
        return;
      }
      
      setAttempt(data);
      
      // Initialize user answers from existing answers
      const answersMap: Record<string, string> = {};
      data.answers?.forEach((answer: Answer) => {
        if (answer.userAnswer) {
          answersMap[answer.questionId] = answer.userAnswer;
        }
      });
      setUserAnswers(answersMap);
    } catch (error) {
      console.error('Error fetching attempt:', error);
      toast.error('Не удалось загрузить тест');
      router.push('/mock-exam');
    } finally {
      setLoading(false);
    }
  }

  const currentQuestion = attempt?.questions[currentQuestionIndex];

  const handleAnswerChange = (questionId: string, answer: string) => {
    if (!currentQuestion) return;

    setUserAnswers(prev => {
      const current = prev[questionId] || '';
      
      if (currentQuestion.questionType === 'SINGLE') {
        // Single answer - replace
        return { ...prev, [questionId]: answer };
      } else {
        // Multiple answer - toggle
        const answers = current ? current.split(',') : [];
        const index = answers.indexOf(answer);
        
        if (index > -1) {
          // Remove answer
          answers.splice(index, 1);
        } else {
          // Add answer
          answers.push(answer);
        }
        
        // Sort and join
        const newAnswer = answers.sort().join(',');
        return { ...prev, [questionId]: newAnswer };
      }
    });
  };

  const toggleShowAnswer = (questionId: string) => {
    setShowAnswer(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const isAnswerSelected = (questionId: string, answer: string): boolean => {
    const userAnswer = userAnswers[questionId] || '';
    if (!userAnswer) return false;
    
    const answers = userAnswer.split(',');
    return answers.includes(answer);
  };

  const isCorrectAnswer = (answer: string): boolean => {
    if (!currentQuestion || !showAnswer[currentQuestion.id]) return false;
    const correctAnswers = currentQuestion.correctAnswer.split(',');
    return correctAnswers.includes(answer);
  };

  const handleNext = () => {
    if (currentQuestionIndex < (attempt?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!attempt) return;
    
    const unanswered = attempt.questions.filter(q => !userAnswers[q.id]).length;
    
    if (unanswered > 0) {
      const confirmed = confirm(
        `У вас ${unanswered} неотвеченных вопросов. Завершить тест?`
      );
      if (!confirmed) return;
    }
    
    setSubmitting(true);
    
    try {
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: attempt.id,
          answers: Object.entries(userAnswers).map(([questionId, userAnswer]) => ({
            questionId,
            userAnswer: userAnswer || null,
          })),
        }),
      });

      if (!response.ok) throw new Error('Failed to submit test');
      
      const data = await response.json();
      toast.success('Тест завершен!');
      router.push(`/mock-exam/result/${attemptId}`);
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error('Не удалось отправить ответы');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Загрузка теста...</div>;
  }

  if (!attempt || !currentQuestion) {
    return <div className="text-center py-8">Тест не найден</div>;
  }

  const progress = ((currentQuestionIndex + 1) / attempt.totalQuestions) * 100;
  const answeredCount = Object.keys(userAnswers).filter(k => userAnswers[k]).length;

  const options = [
    { key: 'a', text: currentQuestion.optionA },
    { key: 'b', text: currentQuestion.optionB },
    { key: 'c', text: currentQuestion.optionC },
    { key: 'd', text: currentQuestion.optionD },
    currentQuestion.optionE ? { key: 'e', text: currentQuestion.optionE } : null,
  ].filter(Boolean) as { key: string; text: string }[];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Вопрос {currentQuestionIndex + 1} из {attempt.totalQuestions}</span>
              <span>Отвечено: {answeredCount} / {attempt.totalQuestions}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Вопрос {currentQuestionIndex + 1}</span>
            <span className={cn(
              'text-sm font-normal px-3 py-1 rounded-full',
              currentQuestion.questionType === 'SINGLE' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-purple-100 text-purple-700'
            )}>
              {currentQuestion.questionType === 'SINGLE' ? 'Один ответ' : 'Несколько ответов'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question Text */}
          <div className="text-lg font-medium">
            {currentQuestion.questionText}
          </div>

          {/* Options */}
          <div className="space-y-3">
            {options.map((option) => {
              const isSelected = isAnswerSelected(currentQuestion.id, option.key);
              const isCorrect = isCorrectAnswer(option.key);
              const showingAnswer = showAnswer[currentQuestion.id];
              
              return (
                <label
                  key={option.key}
                  className={cn(
                    'flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
                    isSelected && !showingAnswer && 'border-blue-500 bg-blue-50',
                    !isSelected && !showingAnswer && 'border-gray-200 hover:border-gray-300',
                    showingAnswer && isCorrect && 'border-green-500 bg-green-50',
                    showingAnswer && isSelected && !isCorrect && 'border-red-500 bg-red-50',
                    showingAnswer && !isSelected && !isCorrect && 'border-gray-200 opacity-60'
                  )}
                >
                  <input
                    type={currentQuestion.questionType === 'SINGLE' ? 'radio' : 'checkbox'}
                    name={`question-${currentQuestion.id}`}
                    value={option.key}
                    checked={isSelected}
                    onChange={() => handleAnswerChange(currentQuestion.id, option.key)}
                    disabled={showingAnswer}
                    className={cn(
                      'mt-1',
                      currentQuestion.questionType === 'SINGLE' ? 'w-5 h-5' : 'w-5 h-5 rounded'
                    )}
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-base">{option.text}</span>
                    {showingAnswer && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                    {showingAnswer && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          {/* Show Answer Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => toggleShowAnswer(currentQuestion.id)}
              className="gap-2"
            >
              {showAnswer[currentQuestion.id] ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Скрыть ответ
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Показать правильный ответ
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          ← Предыдущий
        </Button>
        
        {currentQuestionIndex === attempt.questions.length - 1 ? (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {submitting ? 'Отправка...' : 'Завершить тест'}
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Следующий →
          </Button>
        )}
      </div>
    </div>
  );
}
