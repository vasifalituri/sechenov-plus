import { Suspense } from 'react';
import QuizTakeClient from '@/components/quiz/QuizTakeClient';

export const metadata = {
  title: 'Прохождение теста - Sechenov+',
};

export default async function CTTakePage({ params }: { params: Promise<{ attemptId: string }> }) {
  const resolvedParams = await params;
  const attemptId = resolvedParams.attemptId;
  
  console.log('🔵 [CTTakePage SERVER] Params:', resolvedParams);
  console.log('🔵 [CTTakePage SERVER] attemptId:', attemptId, 'type:', typeof attemptId);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div>Загрузка теста...</div>}>
        <QuizTakeClient attemptId={attemptId} />
      </Suspense>
    </div>
  );
}
