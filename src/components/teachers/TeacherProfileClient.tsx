'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, BookOpen, Award, TrendingUp } from 'lucide-react';
import TeacherRatingForm from './TeacherRatingForm';
import TeacherReviewForm from './TeacherReviewForm';
import TeacherReviewItem from './TeacherReviewItem';
import { useRouter } from 'next/navigation';

interface TeacherProfileClientProps {
  teacher: any;
  userRating: any;
  currentUserId: string;
  isAdminOrModerator: boolean;
}

export default function TeacherProfileClient({
  teacher,
  userRating,
  currentUserId,
  isAdminOrModerator,
}: TeacherProfileClientProps) {
  const router = useRouter();
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviews, setReviews] = useState(teacher.reviews || []);

  const initials = teacher.fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Вычисляем средние оценки по категориям
  const categoryAverages = {
    knowledge: 0,
    teaching: 0,
    communication: 0,
    fairness: 0,
  };

  if (teacher.ratings.length > 0) {
    teacher.ratings.forEach((r: any) => {
      categoryAverages.knowledge += r.knowledgeRating;
      categoryAverages.teaching += r.teachingRating;
      categoryAverages.communication += r.communicationRating;
      categoryAverages.fairness += r.fairnessRating;
    });

    const count = teacher.ratings.length;
    categoryAverages.knowledge /= count;
    categoryAverages.teaching /= count;
    categoryAverages.communication /= count;
    categoryAverages.fairness /= count;
  }

  const handleSuccess = async (newReview?: any) => {
    setShowRatingForm(false);
    setShowReviewForm(false);
    
    // Если пришел новый отзыв (из компонента формы), добавляем его сразу
    if (newReview) {
      setReviews([newReview, ...reviews]);
    } else {
      // Иначе перезагружаем страницу
      router.refresh();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Профиль преподавателя */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          <Avatar className="w-32 h-32">
            <AvatarImage src={teacher.photoUrl || undefined} alt={teacher.fullName} />
            <AvatarFallback className="bg-blue-100 text-blue-600 text-3xl">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{teacher.fullName}</h1>
            
            {teacher.position && (
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                {teacher.position}
              </p>
            )}

            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <BookOpen size={20} />
                <span>{teacher.department}</span>
              </div>

              {teacher.academicDegree && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Award size={20} />
                  <span>{teacher.academicDegree}</span>
                </div>
              )}
            </div>

            {teacher.subjects && teacher.subjects.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Преподаваемые предметы:</p>
                <div className="flex flex-wrap gap-2">
                  {teacher.subjects.map((ts: any) => (
                    <span
                      key={ts.id}
                      className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm"
                    >
                      {ts.subject.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {teacher.bio && (
              <p className="text-gray-700 dark:text-gray-300 mt-4">{teacher.bio}</p>
            )}
          </div>

          {/* Общий рейтинг */}
          <div className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star size={32} className="fill-yellow-400 text-yellow-400" />
              <span className="text-4xl font-bold">
                {teacher.averageRating > 0 ? teacher.averageRating.toFixed(1) : 'N/A'}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {teacher.totalRatings}{' '}
              {teacher.totalRatings === 1
                ? 'оценка'
                : teacher.totalRatings < 5
                ? 'оценки'
                : 'оценок'}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Левая колонка - Детальный рейтинг */}
        <div className="lg:col-span-1 space-y-6">
          {/* Категории рейтинга */}
          {teacher.totalRatings > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Детальная оценка</h2>
              <div className="space-y-4">
                <RatingCategory
                  label="Знание предмета"
                  rating={categoryAverages.knowledge}
                />
                <RatingCategory
                  label="Качество преподавания"
                  rating={categoryAverages.teaching}
                />
                <RatingCategory
                  label="Коммуникабельность"
                  rating={categoryAverages.communication}
                />
                <RatingCategory
                  label="Справедливость"
                  rating={categoryAverages.fairness}
                />
              </div>
            </Card>
          )}

          {/* Форма оценки */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {userRating ? 'Ваша оценка' : 'Оценить преподавателя'}
            </h2>
            {showRatingForm ? (
              <TeacherRatingForm
                teacherId={teacher.id}
                existingRating={userRating}
                onSuccess={handleSuccess}
              />
            ) : (
              <Button
                onClick={() => setShowRatingForm(true)}
                className="w-full"
              >
                {userRating ? 'Изменить оценку' : 'Оценить'}
              </Button>
            )}
          </Card>
        </div>

        {/* Правая колонка - Отзывы */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Отзывы студентов ({teacher._count.reviews})
            </h2>

            {!showReviewForm && (
              <Button
                onClick={() => setShowReviewForm(true)}
                className="mb-4"
              >
                Написать отзыв
              </Button>
            )}

            {showReviewForm && (
              <div className="mb-6 border rounded-lg p-4">
                <TeacherReviewForm
                  teacherId={teacher.id}
                  onSuccess={handleSuccess}
                />
              </div>
            )}

            {reviews.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Пока нет отзывов об этом преподавателе
              </p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review: any) => (
                  <TeacherReviewItem
                    key={review.id}
                    review={review}
                    currentUserId={currentUserId}
                    isAdminOrModerator={isAdminOrModerator}
                    onUpdate={() => router.refresh()}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function RatingCategory({ label, rating }: { label: string; rating: number }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-semibold">{rating.toFixed(1)}/5</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-yellow-400 h-2 rounded-full transition-all"
          style={{ width: `${(rating / 5) * 100}%` }}
        />
      </div>
    </div>
  );
}
