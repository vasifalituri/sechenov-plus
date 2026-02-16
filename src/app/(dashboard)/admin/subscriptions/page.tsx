'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SubscriptionSettings {
  id: string;
  monthlyPrice: number | null;
  yearlyPrice: number;
  quickTestLimit: number;
  dataRetentionDays: number;
  currency: string;
  freeTrialDays: number;
  aiAnalysisEnabled: boolean;
  thematicBlocksForPaidOnly: boolean;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  email: string;
  fullName: string;
}

export default function AdminSubscriptionsPage() {
  const [settings, setSettings] = useState<SubscriptionSettings | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [months, setMonths] = useState<number>(12);
  const [loading, setLoading] = useState(true);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/admin/subscription-settings');
        if (!res.ok) throw new Error('Failed to load settings');
        const data = await res.json();
        setSettings(data.settings);
      } catch (error) {
        console.error('Error loading settings:', error);
        toast.error('Ошибка при загрузке настроек');
      } finally {
        setLoading(false);
      }
    };

    const loadUsers = async () => {
      try {
        const res = await fetch('/api/admin/users/list');
        const data = await res.json();
        console.log('Users response:', data);
        setUsers(data.data || data.users || []);
      } catch (error) {
        console.error('Error loading users:', error);
        toast.error('Ошибка при загрузке пользователей');
      }
    };

    loadSettings();
    loadUsers();
  }, []);

  const handleUpdateSettings = async () => {
    if (!settings) return;

    try {
      const res = await fetch('/api/admin/subscription-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyPrice: settings.monthlyPrice,
          yearlyPrice: settings.yearlyPrice,
          quickTestLimit: settings.quickTestLimit,
          dataRetentionDays: settings.dataRetentionDays,
          currency: settings.currency,
          freeTrialDays: settings.freeTrialDays,
          aiAnalysisEnabled: settings.aiAnalysisEnabled,
          thematicBlocksForPaidOnly: settings.thematicBlocksForPaidOnly,
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        toast.success('Настройки сохранены');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Ошибка при сохранении');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Ошибка при сохранении');
    }
  };

  const handleGrantSubscription = async () => {
    if (!selectedUserId) {
      toast.error('Выберите пользователя');
      return;
    }

    try {
      const res = await fetch('/api/admin/grant-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          months
        })
      });

      if (res.ok) {
        toast.success(`Подписка выдана на ${months} месяцев`);
        setSelectedUserId('');
        setMonths(12);
      } else {
        toast.error('Ошибка при выдаче подписки');
      }
    } catch (error) {
      console.error('Error granting subscription:', error);
      toast.error('Ошибка при выдаче подписки');
    }
  };

  if (loading) {
    return <div className="p-8">Загрузка...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Управление подписками</h1>

      {/* Settings */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Настройки подписки</CardTitle>
          <CardDescription>Управляйте тарифами и лимитами</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Цена в месяц (манаты)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={settings.monthlyPrice || 0}
                    onChange={(e) => setSettings({ ...settings, monthlyPrice: parseFloat(e.target.value) || null })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Цена в год (манаты)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={settings.yearlyPrice || 0}
                    onChange={(e) => setSettings({ ...settings, yearlyPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Валюта</label>
                  <Input
                    type="text"
                    value={settings.currency || 'AZN'}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Быстрые тесты в день (бесплатно)</label>
                  <Input
                    type="number"
                    value={settings.quickTestLimit || 1}
                    onChange={(e) => setSettings({ ...settings, quickTestLimit: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Дни пробного периода</label>
                  <Input
                    type="number"
                    value={settings.freeTrialDays || 0}
                    onChange={(e) => setSettings({ ...settings, freeTrialDays: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Сохранение данных (дни)</label>
                  <Input
                    type="number"
                    value={settings.dataRetentionDays || 2}
                    onChange={(e) => setSettings({ ...settings, dataRetentionDays: parseInt(e.target.value) || 2 })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="aiEnabled"
                    checked={settings.aiAnalysisEnabled}
                    onChange={(e) => setSettings({ ...settings, aiAnalysisEnabled: e.target.checked })}
                  />
                  <label htmlFor="aiEnabled" className="text-sm font-medium">ИИ анализ включен</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="thematicBlocks"
                    checked={settings.thematicBlocksForPaidOnly}
                    onChange={(e) => setSettings({ ...settings, thematicBlocksForPaidOnly: e.target.checked })}
                  />
                  <label htmlFor="thematicBlocks" className="text-sm font-medium">Тематические блоки только для платных</label>
                </div>
              </div>

              <Button onClick={handleUpdateSettings} className="w-full">Сохранить все настройки</Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Grant Subscription */}
      <Card>
        <CardHeader>
          <CardTitle>Выдать подписку пользователю</CardTitle>
          <CardDescription>Выдайте премиум доступ вручную</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Пользователь</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Выберите пользователя</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.fullName || user.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Месяцев</label>
            <Input
              type="number"
              value={months || 12}
              onChange={(e) => setMonths(parseInt(e.target.value) || 12)}
              min="1"
            />
          </div>
          <Button onClick={handleGrantSubscription} className="w-full">
            Выдать подписку
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
