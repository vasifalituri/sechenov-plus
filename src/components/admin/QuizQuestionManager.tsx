'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface QuizQuestionManagerProps {
  subjects: any[];
  selectedSubject: string;
}

export default function QuizQuestionManager({ subjects, selectedSubject }: QuizQuestionManagerProps) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const [formData, setFormData] = useState({
    subjectId: selectedSubject || '',
    blockId: '',
    questionText: '',
    questionImage: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    optionE: '',
    correctAnswer: 'A',
    explanation: '',
    difficulty: 'MEDIUM',
    tags: [] as string[],
  });

  useEffect(() => {
    fetchBlocks();
  }, [selectedSubject]);

  useEffect(() => {
    fetchQuestions();
  }, [selectedSubject, selectedBlock, searchQuery, pagination.page]);

  const fetchBlocks = async () => {
    try {
      const url = selectedSubject 
        ? `/api/admin/quiz/blocks?subjectId=${selectedSubject}`
        : '/api/admin/quiz/blocks';
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBlocks(data);
      }
    } catch (error) {
      console.error('Error fetching blocks:', error);
    }
  };

  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (selectedSubject) params.append('subjectId', selectedSubject);
      if (selectedBlock) params.append('blockId', selectedBlock);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/admin/quiz/questions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Ошибка загрузки вопросов');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (question?: any) => {
    if (question) {
      setEditingQuestion(question);
      setFormData({
        subjectId: question.subjectId,
        blockId: question.blockId || '',
        questionText: question.questionText,
        questionImage: question.questionImage || '',
        optionA: question.optionA,
        optionB: question.optionB,
        optionC: question.optionC,
        optionD: question.optionD,
        optionE: question.optionE || '',
        correctAnswer: question.correctAnswer,
        explanation: question.explanation || '',
        difficulty: question.difficulty,
        tags: question.tags || [],
      });
    } else {
      setEditingQuestion(null);
      setFormData({
        subjectId: selectedSubject || '',
        blockId: selectedBlock || '',
        questionText: '',
        questionImage: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        optionE: '',
        correctAnswer: 'A',
        explanation: '',
        difficulty: 'MEDIUM',
        tags: [],
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subjectId || !formData.questionText || !formData.optionA || 
        !formData.optionB || !formData.optionC || !formData.optionD) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    try {
      const url = editingQuestion 
        ? `/api/admin/quiz/questions/${editingQuestion.id}`
        : '/api/admin/quiz/questions';
      
      const method = editingQuestion ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          blockId: formData.blockId || null,
        }),
      });

      if (res.ok) {
        toast.success(editingQuestion ? 'Вопрос обновлен' : 'Вопрос создан');
        setDialogOpen(false);
        fetchQuestions();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Ошибка сохранения');
      }
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('Ошибка сохранения вопроса');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить этот вопрос?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/quiz/questions/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Вопрос удален');
        fetchQuestions();
      } else {
        toast.error('Ошибка удаления');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Ошибка удаления вопроса');
    }
  };

  return (
    <div className="space-y-4">
      {/* Фильтры */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Блок</label>
            <select
              value={selectedBlock}
              onChange={(e) => setSelectedBlock(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Все блоки</option>
              {blocks.map((block) => (
                <option key={block.id} value={block.id}>
                  {block.title} ({block._count?.questions || 0})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Поиск</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по тексту вопроса или вариантам ответов..."
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Заголовок и кнопка добавления */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">
            Вопросы ({pagination.total})
          </h2>
          <p className="text-sm text-gray-600">
            Страница {pagination.page} из {pagination.totalPages}
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Добавить вопрос
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? 'Редактировать вопрос' : 'Добавить вопрос'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Предмет *</label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Выберите предмет</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Блок (необязательно)</label>
                  <select
                    value={formData.blockId}
                    onChange={(e) => setFormData({ ...formData, blockId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Общий банк вопросов</option>
                    {blocks.filter(b => b.subjectId === formData.subjectId).map((block) => (
                      <option key={block.id} value={block.id}>
                        {block.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Текст вопроса *</label>
                <textarea
                  value={formData.questionText}
                  onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">URL изображения (необязательно)</label>
                <Input
                  value={formData.questionImage}
                  onChange={(e) => setFormData({ ...formData, questionImage: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Варианты ответов *</label>
                
                {['A', 'B', 'C', 'D', 'E'].map((option) => (
                  <div key={option} className="flex gap-2">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="correctAnswer"
                        value={option}
                        checked={formData.correctAnswer === option}
                        onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                        className="mr-2"
                      />
                      <span className="font-medium">{option})</span>
                    </div>
                    <Input
                      value={formData[`option${option}` as keyof typeof formData] as string}
                      onChange={(e) => setFormData({ ...formData, [`option${option}`]: e.target.value })}
                      placeholder={`Вариант ${option}${option === 'E' ? ' (необязательно)' : ''}`}
                      required={option !== 'E'}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Объяснение (необязательно)</label>
                <textarea
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                  placeholder="Объяснение правильного ответа..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Сложность</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="EASY">Легкий</option>
                  <option value="MEDIUM">Средний</option>
                  <option value="HARD">Сложный</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Отмена
                </Button>
                <Button type="submit">
                  {editingQuestion ? 'Сохранить' : 'Создать'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Список вопросов */}
      {isLoading ? (
        <div className="text-center py-8">Загрузка вопросов...</div>
      ) : questions.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">
            Вопросы не найдены. Добавьте первый вопрос или измените фильтры.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {questions.map((question, index) => (
              <Card key={question.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-500">
                        #{(pagination.page - 1) * pagination.limit + index + 1}
                      </span>
                      {question.block && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                          {question.block.title}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        question.difficulty === 'EASY' ? 'bg-green-100 text-green-600' :
                        question.difficulty === 'HARD' ? 'bg-red-100 text-red-600' :
                        'bg-yellow-100 text-yellow-600'
                      }`}>
                        {question.difficulty === 'EASY' ? 'Легкий' :
                         question.difficulty === 'HARD' ? 'Сложный' : 'Средний'}
                      </span>
                    </div>
                    
                    <p className="font-medium mb-3">{question.questionText}</p>
                    
                    <div className="grid grid-cols-1 gap-1 text-sm">
                      {['A', 'B', 'C', 'D', 'E'].map((option) => {
                        const text = question[`option${option}`];
                        if (!text) return null;
                        const isCorrect = question.correctAnswer === option;
                        return (
                          <div
                            key={option}
                            className={`flex gap-2 ${isCorrect ? 'text-green-600 font-medium' : ''}`}
                          >
                            <span>{option})</span>
                            <span>{text}</span>
                            {isCorrect && <span>✓</span>}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex gap-4 mt-3 text-xs text-gray-500">
                      <span>👁 {question.timesShown}</span>
                      <span>✅ {question.timesCorrect}</span>
                      <span>❌ {question.timesWrong}</span>
                      <span>
                        📊 {question.timesShown > 0 
                          ? `${((question.timesCorrect / question.timesShown) * 100).toFixed(0)}%`
                          : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(question)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(question.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Пагинация */}
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <span className="text-sm text-gray-600">
              Страница {pagination.page} из {pagination.totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= pagination.totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
