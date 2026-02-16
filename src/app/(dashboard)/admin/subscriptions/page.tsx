'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface SubscriptionSettings {
  id: string;
  yearlyPrice: number;
  monthlyPrice?: number;
  currency: string;
  quickTestLimit: number;
  dataRetentionDays: number;
  aiAnalysisEnabled: boolean;
  thematicBlocksForPaidOnly: boolean;
}

export default function SubscriptionsAdminPage() {
  const [settings, setSettings] = useState<SubscriptionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/subscriptions/settings');
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Не удалось загрузить настройки');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch('/api/subscriptions/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (!res.ok) throw new Error('Failed to save');
      toast.success('Настройки сохранены');
      await fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4">Загрузка...</div>;
  if (!settings) return <div className="p-4">Ошибка загрузки</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          Настройки подписок
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
          {/* Цена */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Цена подписки (в год)
            </label>
            <input
              type="number"
              value={settings.yearlyPrice}
              onChange={(e) => setSettings({ ...settings, yearlyPrice: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Валюта */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Валюта
            </label>
            <select
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="AZN">AZN (манат)</option>
              <option value="RUB">RUB (рубль)</option>
              <option value="USD">USD (доллар)</option>
            </select>
          </div>

          {/* Лимит быстрых тестов */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Быстрые тесты в день (для бесплатных)
            </label>
            <input
              type="number"
              value={settings.quickTestLimit}
              onChange={(e) => setSettings({ ...settings, quickTestLimit: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Сохранение данных */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Сохранение результатов тестов (дни)
            </label>
            <input
              type="number"
              value={settings.dataRetentionDays}
              onChange={(e) => setSettings({ ...settings, dataRetentionDays: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Функции */}
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.aiAnalysisEnabled}
                onChange={(e) => setSettings({ ...settings, aiAnalysisEnabled: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Анализ с ИИ (для платных)
              </span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.thematicBlocksForPaidOnly}
                onChange={(e) => setSettings({ ...settings, thematicBlocksForPaidOnly: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Тематические блоки (только для платных)
              </span>
            </label>
          </div>

          {/* Кнопка сохранения */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}
