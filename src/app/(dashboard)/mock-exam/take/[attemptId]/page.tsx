import { Suspense } from 'react';
import MockExamTakeClient from '@/components/mock-exam/MockExamTakeClient';

export default function MockExamTakePage({ params }: { params: { attemptId: string } }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div>Загрузка теста...</div>}>
        <MockExamTakeClient attemptId={params.attemptId} />
      </Suspense>
    </div>
  );
}
