import { Suspense } from 'react';
import MockExamResultClient from '@/components/mock-exam/MockExamResultClient';

export default function MockExamResultPage({ params }: { params: { attemptId: string } }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div>Загрузка результатов...</div>}>
        <MockExamResultClient attemptId={params.attemptId} />
      </Suspense>
    </div>
  );
}
