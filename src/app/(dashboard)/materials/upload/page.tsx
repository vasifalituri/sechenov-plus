'use client';

import { MaterialUploadForm } from '@/components/materials/MaterialUploadForm';
import { SupabaseSetupBanner } from '@/components/materials/SupabaseSetupBanner';

export default function UploadMaterialPage() {
  return (
    <>
      <SupabaseSetupBanner />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Загрузить материал</h1>
          <p className="text-gray-600">
            Загрузите учебные материалы для других студентов. Поддерживаются файлы до 200MB.
          </p>
        </div>
        
        <MaterialUploadForm />
      </div>
    </>
  );
}
