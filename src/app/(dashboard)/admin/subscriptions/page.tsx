'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SubscriptionSettings {
  id: string;
  monthlyPrice: number;
  yearlyPrice: number;
  quickTestsPerDay: number;
  dataRetentionDays: number;
}

interface User {
  id: string;
  email: string;
  name: string;
}

export default function AdminSubscriptionsPage() {
  const [settings, setSettings] = useState<SubscriptionSettings | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [months, setMonths] = useState(12);
  const [loading, setLoading] = useState(true);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/subscriptions/settings');
        const data = await res.json();
        setSettings(data);
      } catch (error) {
        console.error('Error loading settings:', error);
        toast.error('Ошибка при загрузке настроек');
      } finally {
        setLoading(false);
      }
    };

    const loadUsers = async () => {
      try {
        const res = await fetch('/api/admin/users');
        const data = await res.json();
        setUsers(data.users || []);
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
      const res = await fetch('/api/subscriptions/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (res.ok) {
        toast.success('Настройки сохранены');
      } else {
        toast.error('Ошибка при сохранении');
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
              <div>
                <label className="block text-sm font-medium mb-2">Цена в месяц (манаты)</label>
                <Input
                  type="number"
                  value={settings.monthlyPrice}
                  onChange={(e) => setSettings({ ...settings, monthlyPrice: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Цена в год (манаты)</label>
                <Input
                  type="number"
                  value={settings.yearlyPrice}
                  onChange={(e) => setSettings({ ...settings, yearlyPrice: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Быстрые тесты в день для бесплатных</label>
                <Input
                  type="number"
                  value={settings.quickTestsPerDay}
                  onChange={(e) => setSettings({ ...settings, quickTestsPerDay: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Сохранение данных (дни)</label>
                <Input
                  type="number"
                  value={settings.dataRetentionDays}
                  onChange={(e) => setSettings({ ...settings, dataRetentionDays: parseInt(e.target.value) })}
                />
              </div>
              <Button onClick={handleUpdateSettings} className="w-full">Сохранить</Button>
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
                  {user.name || user.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Месяцев</label>
            <Input
              type="number"
              value={months}
              onChange={(e) => setMonths(parseInt(e.target.value))}
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
