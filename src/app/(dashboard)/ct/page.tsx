import { Suspense } from 'react';
import CTSubjectsClient from '@/components/ct/CTSubjectsClient';

export const metadata = {
  title: 'ЦТ - Sechenov+',
  description: 'Подготовка к централизованному тестированию',
};

export default function CTPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Централизованное тестирование</h1>
        <p className="text-gray-600 mt-2">
          Выберите дисциплину
        </p>
      </div>
      
      <Suspense fallback={<div>Загрузка...</div>}>
        <CTSubjectsClient />
      </Suspense>
    </div>
  );
}
