import { Suspense } from 'react';
import CTSubjectBlocksClient from '@/components/ct/CTSubjectBlocksClient';

export default function CTSubjectBlocksPage({ params }: { params: { subject: string } }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div>Загрузка...</div>}>
        <CTSubjectBlocksClient subjectSlug={params.subject} />
      </Suspense>
    </div>
  );
}
