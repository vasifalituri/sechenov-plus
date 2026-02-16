'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface SubscriptionSettings {
  yearlyPrice: number;
  currency: string;
}

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<SubscriptionSettings | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Получить настройки подписок
        const settingsRes = await fetch('/api/subscriptions/settings');
        const settingsData = await settingsRes.json();
        setSettings(settingsData);

        // Проверить подписку пользователя
        if (session?.user?.id) {
          const subRes = await fetch('/api/subscriptions/check');
          const subData = await subRes.json();
          setIsSubscribed(subData.isSubscribed);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  const handleSubscribe = async () => {
    if (!session?.user?.id) {
      router.push('/login');
      return;
    }

    toast.info('PayPal интеграция скоро будет доступна...');
    // TODO: Implement PayPal checkout
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Загрузка...</div>;
  }

  if (!settings) {
    return <div className="flex justify-center items-center h-screen">Ошибка загрузки</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Выберите тариф
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Получите доступ ко всем премиум функциям
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Бесплатный тариф */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Бесплатно
            </h2>
            <div className="mb-6">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                0 <span className="text-lg text-gray-600 dark:text-gray-400">{settings.currency}</span>
              </p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <span className="text-green-500 mr-3">✓</span>
                <span className="text-gray-700 dark:text-gray-300">1 быстрый тест в день</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-3">✓</span>
                <span className="text-gray-700 dark:text-gray-300">Пробный тест с анализом</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-400 mr-3">✗</span>
                <span className="text-gray-500">Анализ всех тестов с ИИ</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-400 mr-3">✗</span>
                <span className="text-gray-500">Тематические блоки</span>
              </li>
            </ul>

            <button
              disabled={!isSubscribed}
              className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white py-2 px-4 rounded-lg font-medium cursor-default"
            >
              Ваш текущий тариф
            </button>
          </div>

          {/* Премиум тариф */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-lg p-8 relative border-2 border-blue-400">
            <div className="absolute top-0 right-0 bg-yellow-400 text-gray-900 px-4 py-2 rounded-bl-lg font-bold">
              ПОПУЛЯРНОЕ
            </div>

            <h2 className="text-2xl font-bold text-white mb-4">
              Premium
            </h2>
            <div className="mb-6">
              <p className="text-4xl font-bold text-white">
                {settings.yearlyPrice} <span className="text-lg">{settings.currency}</span>
              </p>
              <p className="text-blue-100 mt-2">в год</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start text-white">
                <span className="text-yellow-300 mr-3">✓</span>
                <span>Неограниченные быстрые тесты</span>
              </li>
              <li className="flex items-start text-white">
                <span className="text-yellow-300 mr-3">✓</span>
                <span>Анализ каждого теста с ИИ</span>
              </li>
              <li className="flex items-start text-white">
                <span className="text-yellow-300 mr-3">✓</span>
                <span>Доступ к тематическим блокам</span>
              </li>
              <li className="flex items-start text-white">
                <span className="text-yellow-300 mr-3">✓</span>
                <span>История результатов за 2 дня</span>
              </li>
            </ul>

            <button
              onClick={handleSubscribe}
              disabled={isSubscribed}
              className="w-full bg-white text-blue-600 py-3 px-4 rounded-lg font-bold hover:bg-blue-50 disabled:bg-gray-400 disabled:text-white transition"
            >
              {isSubscribed ? 'У вас есть подписка' : 'Купить подписку'}
            </button>
          </div>
        </div>

        {/* Пробный тест */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            🎉 Попробуйте бесплатно
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Пройдите пробный тест и получите полный анализ от ИИ без оплаты!
          </p>
          <button
            onClick={() => router.push('/ct')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition"
          >
            Пройти пробный тест
          </button>
        </div>
      </div>
    </div>
  );
}
