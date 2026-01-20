import { useState, useCallback } from 'react';
import { discussionService, Discussion, Comment } from '@/services/discussionService';

export function useDiscussion(id: string) {
  const [thread, setThread] = useState<(Discussion & { comments: Comment[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchThread = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await discussionService.getById(id);
      setThread(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch discussion');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const addComment = useCallback(async (content: string, parentId?: string) => {
    try {
      await discussionService.comments.create(id, content, parentId);
      await fetchThread(); // Refresh
    } catch (err) {
      throw err;
    }
  }, [id, fetchThread]);

  const deleteComment = useCallback(async (commentId: string) => {
    try {
      await discussionService.comments.delete(id, commentId);
      await fetchThread(); // Refresh
    } catch (err) {
      throw err;
    }
  }, [id, fetchThread]);

  const togglePin = useCallback(async () => {
    try {
      const result = await discussionService.togglePin(id);
      if (thread) {
        setThread({ ...thread, isPinned: result.isPinned });
      }
    } catch (err) {
      throw err;
    }
  }, [id, thread]);

  const deleteThread = useCallback(async () => {
    await discussionService.delete(id);
  }, [id]);

  return {
    thread,
    isLoading,
    error,
    fetchThread,
    addComment,
    deleteComment,
    togglePin,
    deleteThread,
  };
}
