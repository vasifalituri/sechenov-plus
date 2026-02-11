import { Suspense } from 'react';
import QuizResultClient from '@/components/quiz/QuizResultClient';

export const metadata = {
  title: 'Результаты теста - Sechenov+',
};

export default async function QuizResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div>Загрузка результатов...</div>}>
        <QuizResultClient attemptId={attemptId} />
      </Suspense>
    </div>
  );
}
