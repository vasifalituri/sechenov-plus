'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Upload, Download, Search, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import QuizBlockManager from './QuizBlockManager';
import QuizQuestionManager from './QuizQuestionManager';
import QuizBulkImport from './QuizBulkImport';

export default function AdminQuizClient() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/subjects');
      if (res.ok) {
        const data = await res.json();
        setSubjects(Array.isArray(data.data) ? data.data : data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Ошибка загрузки предметов');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Выбор предмета */}
      <Card className="p-6">
        <label className="block text-sm font-medium mb-2">
          Выберите предмет
        </label>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="w-full max-w-md px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Все предметы</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </Card>

      {/* Табы для разных разделов */}
      <Tabs defaultValue="blocks" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="blocks">
            <FileText className="w-4 h-4 mr-2" />
            Блоки тестов
          </TabsTrigger>
          <TabsTrigger value="questions">
            <Edit className="w-4 h-4 mr-2" />
            Вопросы
          </TabsTrigger>
          <TabsTrigger value="import">
            <Upload className="w-4 h-4 mr-2" />
            Импорт
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blocks" className="mt-6">
          <QuizBlockManager 
            subjects={subjects}
            selectedSubject={selectedSubject}
          />
        </TabsContent>

        <TabsContent value="questions" className="mt-6">
          <QuizQuestionManager 
            subjects={subjects}
            selectedSubject={selectedSubject}
          />
        </TabsContent>

        <TabsContent value="import" className="mt-6">
          <QuizBulkImport 
            subjects={subjects}
            selectedSubject={selectedSubject}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
