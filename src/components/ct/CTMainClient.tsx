'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, BookOpen, Lock } from 'lucide-react';
import QuizMainClient from '@/components/quiz/QuizMainClient';
import QuickTestClient from '@/components/ct/QuickTestClient';
import Link from 'next/link';

export default function CTMainClient() {
  const [activeTab, setActiveTab] = useState('quick');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const res = await fetch('/api/subscriptions/check');
        const data = await res.json();
        setIsSubscribed(data.isSubscribed);
      } catch (error) {
        console.error('Error checking subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, []);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="quick" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>Быстрый тест</span>
          </TabsTrigger>
          <TabsTrigger 
            value="thematic" 
            className="flex items-center gap-2"
            disabled={!isSubscribed && !loading}
          >
            {!isSubscribed && <Lock className="w-4 h-4" />}
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
          {!isSubscribed && !loading ? (
            <div className="bg-yellow-50 dark:bg-yellow-900 border-2 border-yellow-200 dark:border-yellow-700 rounded-lg p-8 text-center">
              <Lock className="w-12 h-12 mx-auto mb-4 text-yellow-600 dark:text-yellow-400" />
              <h3 className="text-xl font-bold text-yellow-900 dark:text-yellow-100 mb-2">
                Только для подписчиков
              </h3>
              <p className="text-yellow-800 dark:text-yellow-200 mb-6">
                Тематические блоки доступны только для Premium подписчиков
              </p>
              <Link href="/pricing">
                <button className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-6 rounded-lg transition">
                  Подписаться за {20} манатов/год
                </button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Тематические блоки</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Выберите тематический блок для целенаправленной подготовки
                </p>
              </div>
              <QuizMainClient />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
