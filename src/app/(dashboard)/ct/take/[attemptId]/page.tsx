import { Suspense } from 'react';
import QuizTakeClient from '@/components/quiz/QuizTakeClient';

export const metadata = {
  title: 'Прохождение теста - Sechenov+',
};

export default function CTTakePage({ params }: { params: { attemptId: string } }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div>Загрузка теста...</div>}>
        <QuizTakeClient attemptId={params.attemptId} />
      </Suspense>
    </div>
  );
}
