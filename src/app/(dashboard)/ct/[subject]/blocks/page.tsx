import { Suspense } from 'react';
import CTSubjectBlocksClient from '@/components/ct/CTSubjectBlocksClient';

export default async function CTSubjectBlocksPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div>Загрузка...</div>}>
        <CTSubjectBlocksClient subjectSlug={subject} />
      </Suspense>
    </div>
  );
}
