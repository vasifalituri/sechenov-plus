import { Suspense } from 'react';
import MockExamClient from '@/components/mock-exam/MockExamClient';

export const metadata = {
  title: 'Пробное ЦТ - Sechenov+',
  description: 'Пробное централизованное тестирование для медицинских студентов',
};

export default function MockExamPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Пробное ЦТ</h1>
        <p className="text-gray-600 mt-2">
          Выберите дисциплину для прохождения пробного тестирования
        </p>
      </div>
      
      <Suspense fallback={<div>Загрузка...</div>}>
        <MockExamClient />
      </Suspense>
    </div>
  );
}
