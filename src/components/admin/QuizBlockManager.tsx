'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

interface QuizBlockManagerProps {
  subjects: any[];
  selectedSubject: string;
}

export default function QuizBlockManager({ subjects, selectedSubject }: QuizBlockManagerProps) {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: selectedSubject || '',
    difficulty: 'MEDIUM',
    orderIndex: 0,
  });

  useEffect(() => {
    fetchBlocks();
  }, [selectedSubject]);

  const fetchBlocks = async () => {
    try {
      setIsLoading(true);
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
      toast.error('Ошибка загрузки блоков');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (block?: any) => {
    if (block) {
      setEditingBlock(block);
      setFormData({
        title: block.title,
        description: block.description || '',
        subjectId: block.subjectId,
        difficulty: block.difficulty,
        orderIndex: block.orderIndex,
      });
    } else {
      setEditingBlock(null);
      setFormData({
        title: '',
        description: '',
        subjectId: selectedSubject || '',
        difficulty: 'MEDIUM',
        orderIndex: 0,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.subjectId) {
      toast.error('Заполните обязательные поля');
      return;
    }

    try {
      const url = editingBlock 
        ? `/api/admin/quiz/blocks/${editingBlock.id}`
        : '/api/admin/quiz/blocks';
      
      const method = editingBlock ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingBlock ? 'Блок обновлен' : 'Блок создан');
        setDialogOpen(false);
        fetchBlocks();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Ошибка сохранения');
      }
    } catch (error) {
      console.error('Error saving block:', error);
      toast.error('Ошибка сохранения блока');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить этот блок? Все вопросы останутся в общем банке.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/quiz/blocks/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Блок удален');
        fetchBlocks();
      } else {
        toast.error('Ошибка удаления');
      }
    } catch (error) {
      console.error('Error deleting block:', error);
      toast.error('Ошибка удаления блока');
    }
  };

  const toggleActive = async (block: any) => {
    try {
      const res = await fetch(`/api/admin/quiz/blocks/${block.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !block.isActive }),
      });

      if (res.ok) {
        toast.success(block.isActive ? 'Блок деактивирован' : 'Блок активирован');
        fetchBlocks();
      }
    } catch (error) {
      console.error('Error toggling block:', error);
      toast.error('Ошибка изменения статуса');
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Загрузка блоков...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          Тематические блоки ({blocks.length})
        </h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Создать блок
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingBlock ? 'Редактировать блок' : 'Создать блок'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Название блока *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Например: Анатомия - Сердечно-сосудистая система"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Описание
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Краткое описание блока..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Предмет *
                </label>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Сложность
                  </label>
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

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Порядок сортировки
                  </label>
                  <Input
                    type="number"
                    value={formData.orderIndex}
                    onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Отмена
                </Button>
                <Button type="submit">
                  {editingBlock ? 'Сохранить' : 'Создать'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {blocks.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">
            Блоки не найдены. Создайте первый блок для начала.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {blocks.map((block) => (
            <Card key={block.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{block.title}</h3>
                    {!block.isActive && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                        Неактивен
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      block.difficulty === 'EASY' ? 'bg-green-100 text-green-600' :
                      block.difficulty === 'HARD' ? 'bg-red-100 text-red-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      {block.difficulty === 'EASY' ? 'Легкий' :
                       block.difficulty === 'HARD' ? 'Сложный' : 'Средний'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">
                    {block.subject?.name}
                  </p>
                  
                  {block.description && (
                    <p className="text-sm text-gray-500 mt-2">
                      {block.description}
                    </p>
                  )}

                  <div className="flex gap-4 mt-3 text-sm text-gray-600">
                    <span>📝 Вопросов: {block._count?.questions || 0}</span>
                    <span>✅ Попыток: {block.totalAttempts}</span>
                    <span>⭐ Средний балл: {block.averageScore.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActive(block)}
                    title={block.isActive ? 'Деактивировать' : 'Активировать'}
                  >
                    <Eye className={`w-4 h-4 ${block.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDialog(block)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(block.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
