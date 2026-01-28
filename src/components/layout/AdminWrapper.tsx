'use client';

import { ThemeProvider } from '@/components/providers/ThemeProvider';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Users, FileText, MessageSquare, BarChart3, Megaphone } from 'lucide-react';

export function AdminWrapper({ children }: { children: React.ReactNode }) {
  const navItems = [
    { href: '/admin', label: 'Панель управления', icon: Home },
    { href: '/admin/users', label: 'Пользователи', icon: Users },
    { href: '/admin/materials', label: 'Материалы', icon: FileText },
    { href: '/admin/discussions', label: 'Обсуждения', icon: MessageSquare },
    { href: '/admin/analytics', label: 'Аналитика', icon: BarChart3 },
    { href: '/admin/announcements', label: 'Объявления', icon: Megaphone },
  ];

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
        <nav className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 transition-colors">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Админ-панель</h1>
              <Link href="/dashboard">
                <Button variant="outline">Вернуться на сайт</Button>
              </Link>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-6">
          <div className="flex gap-6">
            <aside className="w-64 shrink-0">
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </nav>
            </aside>

            <main className="flex-1">{children}</main>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
