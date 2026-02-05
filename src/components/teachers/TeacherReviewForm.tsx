'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';

interface TeacherReviewFormProps {
  teacherId: string;
  onSuccess?: () => void;
}

export default function TeacherReviewForm({
  teacherId,
  onSuccess,
}: TeacherReviewFormProps) {
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (content.trim().length < 10) {
      toast.error('Отзыв должен содержать минимум 10 символов');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/teachers/${teacherId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          isAnonymous,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Не удалось отправить отзыв');
      }

      toast.success(
        'Спасибо за ваш отзыв! Он будет опубликован после модерации.'
      );
      setContent('');
      setIsAnonymous(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="review" className="block text-sm font-medium mb-2">
          Ваш отзыв
        </label>
        <Textarea
          id="review"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Поделитесь своим мнением о преподавателе..."
          rows={5}
          disabled={isSubmitting}
        />
        <p className="text-sm text-gray-500 mt-1">
          Минимум 10 символов. Будьте корректны и объективны.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="anonymous"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
          disabled={isSubmitting}
          className="rounded"
        />
        <label htmlFor="anonymous" className="text-sm">
          Оставить отзыв анонимно
        </label>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || content.trim().length < 10}>
          {isSubmitting ? 'Отправка...' : 'Отправить отзыв'}
        </Button>
      </div>
    </form>
  );
}
