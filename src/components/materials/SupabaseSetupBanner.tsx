'use client';

import { useState } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { X, ExternalLink } from 'lucide-react';

export function SupabaseSetupBanner() {
  const [isDismissed, setIsDismissed] = useState(false);
  const isConfigured = isSupabaseConfigured();

  if (isConfigured || isDismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">⚠️</span>
              <h3 className="font-semibold text-yellow-900">
                Supabase Storage не настроен
              </h3>
            </div>
            <p className="text-sm text-yellow-800 mb-2">
              Загрузка файлов недоступна. Настройте Supabase Storage для поддержки файлов до 200MB.
            </p>
            <a
              href="https://github.com/yourusername/yourproject/blob/main/QUICK_START.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-yellow-900 hover:text-yellow-700 underline"
            >
              Инструкция по настройке (5 минут)
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-yellow-700 hover:text-yellow-900 p-1"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
