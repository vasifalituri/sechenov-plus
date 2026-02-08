import { Suspense } from 'react';
import QuizResultsListClient from '@/components/quiz/QuizResultsListClient';

export const metadata = {
  title: 'Результаты ЦТ - Sechenov+',
  description: 'История прохождения тестов',
};

export default function QuizResultsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Результаты ЦТ</h1>
        <p className="text-gray-600 mt-2">
          История всех пройденных тестов
        </p>
      </div>
      
      <Suspense fallback={<div>Загрузка...</div>}>
        <QuizResultsListClient />
      </Suspense>
    </div>
  );
}
