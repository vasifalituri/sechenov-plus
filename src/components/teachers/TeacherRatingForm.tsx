'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';

interface TeacherRatingFormProps {
  teacherId: string;
  existingRating?: {
    knowledgeRating: number;
    teachingRating: number;
    communicationRating: number;
    fairnessRating: number;
  };
  onSuccess?: () => void;
}

export default function TeacherRatingForm({
  teacherId,
  existingRating,
  onSuccess,
}: TeacherRatingFormProps) {
  const [knowledgeRating, setKnowledgeRating] = useState(
    existingRating?.knowledgeRating || 0
  );
  const [teachingRating, setTeachingRating] = useState(
    existingRating?.teachingRating || 0
  );
  const [communicationRating, setCommunicationRating] = useState(
    existingRating?.communicationRating || 0
  );
  const [fairnessRating, setFairnessRating] = useState(
    existingRating?.fairnessRating || 0
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !knowledgeRating ||
      !teachingRating ||
      !communicationRating ||
      !fairnessRating
    ) {
      toast.error('Пожалуйста, заполните все оценки');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/teachers/${teacherId}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          knowledgeRating,
          teachingRating,
          communicationRating,
          fairnessRating,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Не удалось оценить преподавателя');
      }

      toast.success(
        existingRating
          ? 'Оценка обновлена успешно!'
          : 'Спасибо за вашу оценку!'
      );
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const RatingStars = ({
    value,
    onChange,
    label,
  }: {
    value: number;
    onChange: (rating: number) => void;
    label: string;
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            <Star
              size={32}
              className={`transition-colors ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600 self-center">
          {value > 0 ? `${value}/5` : 'Не оценено'}
        </span>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Оцените преподавателя</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Ваша оценка поможет другим студентам в выборе преподавателя
        </p>
      </div>

      <RatingStars
        value={knowledgeRating}
        onChange={setKnowledgeRating}
        label="Знание предмета"
      />

      <RatingStars
        value={teachingRating}
        onChange={setTeachingRating}
        label="Качество преподавания"
      />

      <RatingStars
        value={communicationRating}
        onChange={setCommunicationRating}
        label="Коммуникабельность"
      />

      <RatingStars
        value={fairnessRating}
        onChange={setFairnessRating}
        label="Справедливость в оценках"
      />

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Сохранение...'
            : existingRating
            ? 'Обновить оценку'
            : 'Отправить оценку'}
        </Button>
      </div>
    </form>
  );
}
