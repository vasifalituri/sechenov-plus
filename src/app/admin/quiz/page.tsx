import { Suspense } from 'react';
import AdminQuizClient from '@/components/admin/AdminQuizClient';

export const metadata = {
  title: 'Управление тестами - Админ панель',
  description: 'Управление тестами ЦТ',
};

export default function AdminQuizPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Управление тестами ЦТ</h1>
        <p className="text-gray-600 mt-2">
          Создавайте блоки вопросов, добавляйте и редактируйте вопросы для подготовки к ЦТ
        </p>
      </div>
      
      <Suspense fallback={<div>Загрузка...</div>}>
        <AdminQuizClient />
      </Suspense>
    </div>
  );
}
