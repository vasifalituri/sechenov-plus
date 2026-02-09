import { Suspense } from 'react';
import CTSubjectModeClient from '@/components/ct/CTSubjectModeClient';

export default function CTSubjectPage({ params }: { params: { subject: string } }) {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <CTSubjectModeClient subjectSlug={params.subject} />
    </Suspense>
  );
}
