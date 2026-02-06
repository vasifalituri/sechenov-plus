import { Suspense } from 'react';
import QuizMainClient from '@/components/quiz/QuizMainClient';

export const metadata = {
  title: 'Тесты ЦТ - Sechenov+',
  description: 'Подготовка к ЦТ с помощью тестов',
};

export default function QuizPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Тесты для подготовки к ЦТ</h1>
        <p className="text-gray-600 mt-2">
          Выберите режим тестирования и начните практику
        </p>
      </div>
      
      <Suspense fallback={<div>Загрузка...</div>}>
        <QuizMainClient />
      </Suspense>
    </div>
  );
}
