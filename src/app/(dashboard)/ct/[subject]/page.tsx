import { Suspense } from 'react';
import MockExamModeSelector from '@/components/mock-exam/MockExamModeSelector';

export default function CTSubjectPage({ params }: { params: { subject: string } }) {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <MockExamModeSelector subjectSlug={params.subject} />
    </Suspense>
  );
}
