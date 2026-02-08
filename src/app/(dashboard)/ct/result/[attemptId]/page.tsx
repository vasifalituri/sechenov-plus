import { Suspense } from 'react';
import QuizResultClient from '@/components/quiz/QuizResultClient';

export const metadata = {
  title: 'Результаты теста - Sechenov+',
};

export default function CTResultPage({ params }: { params: { attemptId: string } }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div>Загрузка результатов...</div>}>
        <QuizResultClient attemptId={params.attemptId} />
      </Suspense>
    </div>
  );
}
