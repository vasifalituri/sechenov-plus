'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Star, User, BookOpen } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TeacherCardProps {
  teacher: {
    id: string;
    fullName: string;
    department: string;
    position?: string;
    photoUrl?: string;
    averageRating: number;
    totalRatings: number;
    subjects?: Array<{
      subject: {
        name: string;
      };
    }>;
  };
}

export default function TeacherCard({ teacher }: TeacherCardProps) {
  const initials = teacher.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link href={`/teachers/${teacher.id}`}>
      <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
        <div className="flex items-start gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={teacher.photoUrl || undefined} alt={teacher.fullName} />
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{teacher.fullName}</h3>
            
            {teacher.position && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {teacher.position}
              </p>
            )}

            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
              <BookOpen size={16} />
              <span>{teacher.department}</span>
            </div>

            {teacher.subjects && teacher.subjects.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {teacher.subjects.slice(0, 3).map((ts, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded"
                  >
                    {ts.subject.name}
                  </span>
                ))}
                {teacher.subjects.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{teacher.subjects.length - 3} ещё
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1">
                <Star size={18} className="fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">
                  {teacher.averageRating > 0
                    ? teacher.averageRating.toFixed(1)
                    : 'N/A'}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                ({teacher.totalRatings}{' '}
                {teacher.totalRatings === 1
                  ? 'оценка'
                  : teacher.totalRatings < 5
                  ? 'оценки'
                  : 'оценок'})
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
