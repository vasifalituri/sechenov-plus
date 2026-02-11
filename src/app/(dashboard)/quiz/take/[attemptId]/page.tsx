import { Suspense } from 'react';
import QuizTakeClient from '@/components/quiz/QuizTakeClient';

export const metadata = {
  title: 'Прохождение теста - Sechenov+',
};

export default async function QuizTakePage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div>Загрузка теста...</div>}>
        <QuizTakeClient attemptId={attemptId} />
      </Suspense>
    </div>
  );
}
