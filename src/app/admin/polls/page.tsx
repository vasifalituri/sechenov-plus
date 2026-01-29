'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, X } from 'lucide-react';

export default function AdminPollsPage() {
  const [polls, setPolls] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const res = await fetch('/api/admin/polls');
      const data = await res.json();
      setPolls(data);
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addOption = () => {
    setOptions([...options, '']);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const filteredOptions = options.filter(o => o.trim());
      
      const res = await fetch('/api/admin/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          description: description || null,
          options: filteredOptions,
        }),
      });

      if (res.ok) {
        setQuestion('');
        setDescription('');
        setOptions(['', '']);
        setShowForm(false);
        fetchPolls();
      } else {
        alert('Ошибка при создании голосования');
      }
    } catch (error) {
      console.error('Error creating poll:', error);
      alert('Ошибка при создании голосования');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (pollId: string) => {
    if (!confirm('Удалить это голосование?')) return;

    try {
      await fetch(`/api/admin/polls?id=${pollId}`, { method: 'DELETE' });
      fetchPolls();
    } catch (error) {
      console.error('Error deleting poll:', error);
    }
  };

  if (isLoading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Голосования</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {showForm ? 'Отмена' : 'Создать голосование'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Новое голосование</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Вопрос *</label>
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Например: Какой предмет самый сложный?"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Описание</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Дополнительная информация (необязательно)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Варианты ответа *</label>
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Вариант ${index + 1}`}
                      required
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeOption(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addOption} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить вариант
                </Button>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Создание...' : 'Создать голосование'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {polls.map((poll) => (
          <Card key={poll.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{poll.question}</CardTitle>
                  {poll.description && (
                    <p className="text-sm text-muted-foreground mt-2">{poll.description}</p>
                  )}
                </div>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(poll.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {poll.options.map((option: any) => (
                  <div key={option.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <span>{option.text}</span>
                    <span className="text-sm text-muted-foreground">
                      {option._count.votes} {option._count.votes === 1 ? 'голос' : 'голосов'}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Всего голосов: {poll._count.votes}
              </p>
            </CardContent>
          </Card>
        ))}

        {polls.length === 0 && (
          <p className="text-center text-muted-foreground">Нет голосований</p>
        )}
      </div>
    </div>
  );
}
