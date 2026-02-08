'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, BookOpen } from 'lucide-react';
import QuizMainClient from '@/components/quiz/QuizMainClient';
import QuickTestClient from '@/components/ct/QuickTestClient';

export default function CTMainClient() {
  const [activeTab, setActiveTab] = useState('quick');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="quick" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>Быстрый тест</span>
          </TabsTrigger>
          <TabsTrigger value="thematic" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span>Тематические блоки</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quick" className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Быстрый тест</h2>
            <p className="text-gray-600 mt-1">
              30 случайных вопросов по выбранной дисциплине
            </p>
          </div>
          <QuickTestClient />
        </TabsContent>

        <TabsContent value="thematic" className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Тематические блоки</h2>
            <p className="text-gray-600 mt-1">
              Выберите тематический блок для целенаправленной подготовки
            </p>
          </div>
          <QuizMainClient />
        </TabsContent>
      </Tabs>
    </div>
  );
}
