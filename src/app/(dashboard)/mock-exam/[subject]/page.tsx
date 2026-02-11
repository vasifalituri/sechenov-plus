import { Suspense } from 'react';
import MockExamModeSelector from '@/components/mock-exam/MockExamModeSelector';

export default async function MockExamSubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div>Загрузка...</div>}>
        <MockExamModeSelector subjectSlug={subject} />
      </Suspense>
    </div>
  );
}
