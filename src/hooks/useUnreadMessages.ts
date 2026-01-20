import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function useUnreadMessages() {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!session?.user) return;

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/messages/unread-count');
        const data = await response.json();
        if (data.success) {
          setUnreadCount(data.count);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();

    // Poll every 30 seconds for new messages
    const interval = setInterval(fetchUnreadCount, 30000);

    // Listen for manual refresh events
    const handleRefresh = () => fetchUnreadCount();
    window.addEventListener('refresh-unread-count', handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('refresh-unread-count', handleRefresh);
    };
  }, [session]);

  return unreadCount;
}
