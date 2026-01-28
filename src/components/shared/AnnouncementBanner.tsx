'use client';

import { useState, useEffect } from 'react';
import { Info, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
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

  const getTypeStyles = (type: Announcement['type']) => {
    switch (type) {
      case 'INFO':
        return {
          gradient: 'from-blue-500 via-blue-600 to-cyan-600',
          icon: <Info className="h-6 w-6 text-white" />,
          shadow: 'shadow-blue-500/30',
        };
      case 'WARNING':
        return {
          gradient: 'from-yellow-500 via-orange-500 to-red-500',
          icon: <AlertCircle className="h-6 w-6 text-white" />,
          shadow: 'shadow-orange-500/30',
        };
      case 'SUCCESS':
        return {
          gradient: 'from-green-500 via-emerald-600 to-teal-600',
          icon: <CheckCircle className="h-6 w-6 text-white" />,
          shadow: 'shadow-green-500/30',
        };
      case 'ERROR':
        return {
          gradient: 'from-red-500 via-rose-600 to-pink-600',
          icon: <XCircle className="h-6 w-6 text-white" />,
          shadow: 'shadow-red-500/30',
        };
    }
  };

  if (loading) {
    return null;
  }

  if (announcements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6">
      {announcements.map((announcement) => {
        const styles = getTypeStyles(announcement.type);
        return (
          <div
            key={announcement.id}
            className={`relative rounded-xl overflow-hidden shadow-lg ${styles.shadow} hover:shadow-xl transition-shadow duration-300`}
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-r ${styles.gradient}`} />
            
            {/* Pattern Overlay */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
            
            {/* Content */}
            <div className="relative p-6">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1 bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                  {styles.icon}
                </div>
                
                {/* Text Content */}
                <div className="flex-1 min-w-0 text-white">
                  <h3 className="font-bold text-xl mb-2 drop-shadow-lg">
                    {announcement.title}
                  </h3>
                  <p className="text-base leading-relaxed whitespace-pre-wrap drop-shadow-md opacity-95 mb-3">
                    {announcement.content}
                  </p>
                  <p className="text-xs opacity-80">
                    👤 {announcement.author.fullName} • 📅 {new Date(announcement.createdAt).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Shine Effect */}
            <div className="absolute top-0 -left-full h-full w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 animate-shine" />
          </div>
        );
      })}
    </div>
  );
}
