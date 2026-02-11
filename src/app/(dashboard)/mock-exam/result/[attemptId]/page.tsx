import { Suspense } from 'react';
import MockExamResultClient from '@/components/mock-exam/MockExamResultClient';

export default async function MockExamResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div>Загрузка результатов...</div>}>
        <MockExamResultClient attemptId={attemptId} />
      </Suspense>
    </div>
  );
}
