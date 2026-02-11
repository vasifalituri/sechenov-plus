import { Suspense } from 'react';
import CTSubjectModeClient from '@/components/ct/CTSubjectModeClient';

export default async function CTSubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params;
  
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <CTSubjectModeClient subjectSlug={subject} />
    </Suspense>
  );
}
