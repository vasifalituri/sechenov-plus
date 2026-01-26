'use client';

import { useState, useEffect } from 'react';
import { X, Info, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  priority: number;
  createdAt: string;
  author: {
    fullName: string;
  };
}

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
    loadDismissedIds();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/announcements');
      const data = await response.json();
      setAnnouncements(data.announcements || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDismissedIds = () => {
    try {
      const stored = localStorage.getItem('dismissedAnnouncements');
      if (stored) {
        setDismissedIds(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading dismissed announcements:', error);
    }
  };

  const handleDismiss = (id: string) => {
    const newDismissedIds = [...dismissedIds, id];
    setDismissedIds(newDismissedIds);
    try {
      localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissedIds));
    } catch (error) {
      console.error('Error saving dismissed announcement:', error);
    }
  };

  const getTypeStyles = (type: Announcement['type']) => {
    switch (type) {
      case 'INFO':
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-900',
          icon: <Info className="h-5 w-5 text-blue-600" />,
        };
      case 'WARNING':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-900',
          icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
        };
      case 'SUCCESS':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-900',
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
        };
      case 'ERROR':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-900',
          icon: <XCircle className="h-5 w-5 text-red-600" />,
        };
    }
  };

  if (loading) {
    return null;
  }

  const visibleAnnouncements = announcements.filter(
    (a) => !dismissedIds.includes(a.id)
  );

  if (visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      {visibleAnnouncements.map((announcement) => {
        const styles = getTypeStyles(announcement.type);
        return (
          <Card
            key={announcement.id}
            className={`${styles.bg} border-2 shadow-sm`}
          >
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">{styles.icon}</div>
                
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold text-lg mb-1 ${styles.text}`}>
                    {announcement.title}
                  </h3>
                  <p className={`text-sm whitespace-pre-wrap ${styles.text} opacity-90`}>
                    {announcement.content}
                  </p>
                  <p className="text-xs mt-2 opacity-70">
                    — {announcement.author.fullName},{' '}
                    {new Date(announcement.createdAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>

                <button
                  onClick={() => handleDismiss(announcement.id)}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Закрыть"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
