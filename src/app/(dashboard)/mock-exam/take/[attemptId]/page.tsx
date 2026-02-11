import { Suspense } from 'react';
import MockExamTakeClient from '@/components/mock-exam/MockExamTakeClient';

export default async function MockExamTakePage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div>Загрузка теста...</div>}>
        <MockExamTakeClient attemptId={attemptId} />
      </Suspense>
    </div>
  );
}
