import { Suspense } from 'react';
import MockExamModeSelector from '@/components/mock-exam/MockExamModeSelector';

export default function MockExamSubjectPage({ params }: { params: { subject: string } }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div>Загрузка...</div>}>
        <MockExamModeSelector subjectSlug={params.subject} />
      </Suspense>
    </div>
  );
}
