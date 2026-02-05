'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import TeacherCard from './TeacherCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeachersPageClient() {
  const { data: session } = useSession();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('averageRating');

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    filterTeachers();
  }, [teachers, searchQuery, selectedDepartment, sortBy]);

  const fetchTeachers = async () => {
    try {
      const response = await fetch(`/api/teachers?sortBy=${sortBy}`);
      if (!response.ok) throw new Error('Не удалось загрузить преподавателей');

      const data = await response.json();
      setTeachers(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filterTeachers = () => {
    let filtered = [...teachers];

    // Поиск по имени
    if (searchQuery) {
      filtered = filtered.filter((teacher) =>
        teacher.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Фильтр по кафедре
    if (selectedDepartment) {
      filtered = filtered.filter(
        (teacher) => teacher.department === selectedDepartment
      );
    }

    // Сортировка
    if (sortBy === 'fullName') {
      filtered.sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru'));
    } else if (sortBy === 'totalRatings') {
      filtered.sort((a, b) => b.totalRatings - a.totalRatings);
    } else {
      filtered.sort((a, b) => b.averageRating - a.averageRating);
    }

    setFilteredTeachers(filtered);
  };

  const departments = Array.from(
    new Set(teachers.map((t) => t.department))
  ).sort();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Рейтинг преподавателей</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Оценки и отзывы студентов о преподавателях университета
        </p>
      </div>

      {/* Фильтры и поиск */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Поиск */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <Input
              type="text"
              placeholder="Поиск по имени..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Кафедра */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="border rounded-md px-3 py-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Все кафедры</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Сортировка */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded-md px-3 py-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="averageRating">По рейтингу</option>
            <option value="totalRatings">По количеству оценок</option>
            <option value="fullName">По имени</option>
          </select>
        </div>
      </div>

      {/* Список преподавателей */}
      {filteredTeachers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Преподаватели не найдены</p>
          {(searchQuery || selectedDepartment) && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchQuery('');
                setSelectedDepartment('');
              }}
              className="mt-4"
            >
              Сбросить фильтры
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeachers.map((teacher) => (
            <TeacherCard key={teacher.id} teacher={teacher} />
          ))}
        </div>
      )}

      {/* Статистика */}
      <div className="mt-8 text-center text-sm text-gray-500">
        Показано {filteredTeachers.length} из {teachers.length} преподавателей
      </div>
    </div>
  );
}
