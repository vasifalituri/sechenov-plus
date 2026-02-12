'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Menu, 
  X, 
  BookOpen, 
  MessageSquare, 
  User, 
  LogOut, 
  LayoutDashboard, 
  Mail,
  Shield,
  Bookmark,
  Link as LinkIcon,
  Users,
  GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const unreadCount = useUnreadMessages();

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const navItems = [
    { href: '/dashboard', label: 'Главная', icon: LayoutDashboard },
    { href: '/materials', label: 'Материалы', icon: BookOpen },
    { href: '/ct', label: 'ЦТ', icon: GraduationCap },
    { href: '/discussions', label: 'Обсуждения', icon: MessageSquare },
    { href: '/teachers', label: 'Преподаватели', icon: Users },
    { href: '/resources', label: 'Ресурсы', icon: LinkIcon },
    { href: '/bookmarks', label: 'Избранное', icon: Bookmark },
    { href: '/messages', label: 'Сообщения', icon: Mail, badge: unreadCount },
  ];

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sliding Menu */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-[280px] bg-white dark:bg-gray-900 shadow-xl z-50 transform transition-transform duration-300 ease-in-out md:hidden',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        suppressHydrationWarning
      >
        <div className="flex flex-col h-full" suppressHydrationWarning>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-800" suppressHydrationWarning>
            <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
              Sechenov+
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          {session?.user && (
            <div className="p-4 border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50" suppressHydrationWarning>
              <div className="flex items-center gap-3" suppressHydrationWarning>
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center" suppressHydrationWarning>
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0" suppressHydrationWarning>
                  <p className="font-medium text-sm truncate">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{session.user.username}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-3" suppressHydrationWarning>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    )}
                  >
                    <div className="flex items-center gap-3" suppressHydrationWarning>
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && item.badge > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="h-5 min-w-[20px] flex items-center justify-center px-1.5 text-xs"
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}

              {/* Profile Link */}
              {session?.user?.username && (
                <Link
                  href={`/users/${session.user.username}`}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    pathname === `/users/${session.user.username}`
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  )}
                >
                  <User className="w-5 h-5" />
                  <span>Мой профиль</span>
                </Link>
              )}

              {/* Admin Link */}
              {(session?.user.role === 'ADMIN' || session?.user.role === 'MODERATOR') && (
                <Link
                  href="/admin"
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    pathname.startsWith('/admin')
                      ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  )}
                >
                  <Shield className="w-5 h-5" />
                  <span>Админ-панель</span>
                </Link>
              )}
            </div>
          </nav>

          {/* Footer Actions */}
          <div className="p-4 border-t dark:border-gray-800 space-y-2" suppressHydrationWarning>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="w-4 h-4 mr-3" />
              Выйти
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
