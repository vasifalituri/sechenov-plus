'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, MessageSquare, User, LogOut, LayoutDashboard, Mail, Bookmark, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { MobileMenu } from './MobileMenu';
import { NotificationBell } from './NotificationBell';

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const unreadCount = useUnreadMessages();

  const navItems = [
    { href: '/dashboard', label: 'Главная', icon: LayoutDashboard },
    { href: '/materials', label: 'Материалы', icon: BookOpen },
    { href: '/discussions', label: 'Обсуждения', icon: MessageSquare },
    { href: '/resources', label: 'Ресурсы', icon: Link2 },
    { href: '/bookmarks', label: 'Избранное', icon: Bookmark },
    { href: '/messages', label: 'Сообщения', icon: Mail, badge: unreadCount },
  ];

  return (
    <nav className="border-b bg-white dark:bg-gray-900 dark:border-gray-800 sticky top-0 z-50 transition-colors">
      <div className="container mx-auto px-4" suppressHydrationWarning>
        <div className="flex items-center justify-between h-16" suppressHydrationWarning>
          {/* Logo */}
          <Link href="/dashboard" className="font-bold text-xl text-blue-600 dark:text-blue-400 flex-shrink-0">
            Sechenov+
          </Link>
          
          {/* Desktop Navigation & Search */}
          <div className="hidden md:flex items-center space-x-4 flex-1 justify-center" suppressHydrationWarning>
            <div className="flex items-center space-x-1" suppressHydrationWarning>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors relative',
                      isActive
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="ml-1 h-5 min-w-[20px] flex items-center justify-center px-1 text-xs"
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-2 flex-shrink-0" suppressHydrationWarning>
            {session?.user.role === 'ADMIN' && (
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  Админ-панель
                </Button>
              </Link>
            )}
            
            {session?.user?.username && (
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="hidden lg:flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={(session.user as any).profileImage || undefined} alt={session.user.name || ''} />
                    <AvatarFallback className="text-xs">
                      {session.user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  {session?.user?.name}
                </Button>
              </Link>
            )}

            <NotificationBell />
            <ThemeToggle />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="hidden lg:flex"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center space-x-2" suppressHydrationWarning>
            <NotificationBell />
            <ThemeToggle />
            <MobileMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}
