'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface QuizBulkImportProps {
  subjects: any[];
  selectedSubject: string;
}

export default function QuizBulkImport({ subjects, selectedSubject }: QuizBulkImportProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState(selectedSubject || '');
  const [selectedBlockId, setSelectedBlockId] = useState('');
  const [blocks, setBlocks] = useState<any[]>([]);

  // Загружаем блоки при выборе предмета
  const fetchBlocks = async (subjectId: string) => {
    if (!subjectId) return;
    try {
      const res = await fetch(`/api/admin/quiz/blocks?subjectId=${subjectId}`);
      if (res.ok) {
        const data = await res.json();
        setBlocks(data);
      }
    } catch (error) {
      console.error('Error fetching blocks:', error);
    }
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedBlockId('');
    fetchBlocks(subjectId);
  };

  const downloadTemplate = () => {
    const template = [
      {
        questionText: 'Пример вопроса: Что такое митохондрия?',
        optionA: 'Органелла клетки, производящая энергию',
        optionB: 'Часть ядра',
        optionC: 'Белковая структура',
        optionD: 'Клеточная мембрана',
        optionE: '', // необязательно
        correctAnswer: 'A',
        explanation: 'Митохондрия - это органелла, где происходит клеточное дыхание',
        difficulty: 'MEDIUM',
        tags: ['биология', 'клетка']
      },
      {
        questionText: 'Еще один пример вопроса...',
        optionA: 'Вариант A',
        optionB: 'Вариант B',
        optionC: 'Вариант C',
        optionD: 'Вариант D',
        optionE: '',
        correctAnswer: 'B',
        explanation: '',
        difficulty: 'EASY',
        tags: []
      }
    ];

    const dataStr = JSON.stringify(template, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'quiz_questions_template.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Шаблон скачан');
  };

  const handleImport = async () => {
    if (!selectedSubjectId) {
      toast.error('Выберите предмет');
      return;
    }

    if (!jsonInput.trim()) {
      toast.error('Вставьте JSON с вопросами');
      return;
    }

    try {
      setIsImporting(true);
      
      // Парсим JSON
      const questions = JSON.parse(jsonInput);
      
      if (!Array.isArray(questions)) {
        toast.error('JSON должен содержать массив вопросов');
        return;
      }

      if (questions.length === 0) {
        toast.error('Массив вопросов пуст');
        return;
      }

      // Отправляем на сервер
      const res = await fetch('/api/admin/quiz/questions/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions,
          subjectId: selectedSubjectId,
          blockId: selectedBlockId || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Успешно импортировано ${data.imported} вопросов!`);
        setJsonInput('');
      } else {
        const error = await res.json();
        if (error.details) {
          toast.error(`Ошибки валидации:\n${error.details.slice(0, 5).join('\n')}`);
        } else {
          toast.error(error.error || 'Ошибка импорта');
        }
      }
    } catch (error: any) {
      console.error('Error importing questions:', error);
      toast.error(error.message || 'Ошибка парсинга JSON');
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonInput(content);
      toast.success('Файл загружен');
    };
    reader.onerror = () => {
      toast.error('Ошибка чтения файла');
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Инструкция */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Как импортировать вопросы:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Скачайте шаблон JSON и ознакомьтесь с форматом</li>
              <li>Подготовьте свои вопросы в том же формате</li>
              <li>Скинь мне файл - я конвертирую его в нужный JSON формат</li>
              <li>Скопируйте JSON и вставьте в поле ниже, или загрузите файл</li>
              <li>Выберите предмет и (опционально) блок</li>
              <li>Нажмите "Импортировать"</li>
            </ol>
          </div>
        </div>
      </Card>

      {/* Скачать шаблон */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold mb-1">Шаблон для импорта</h3>
            <p className="text-sm text-gray-600">
              Скачайте JSON шаблон с примерами вопросов
            </p>
          </div>
          <Button onClick={downloadTemplate} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Скачать шаблон
          </Button>
        </div>
      </Card>

      {/* Форма импорта */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Импорт вопросов</h3>
        
        <div className="space-y-4">
          {/* Выбор предмета и блока */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Предмет *
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
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
              <label className="block text-sm font-medium mb-1">
                Блок (необязательно)
              </label>
              <select
                value={selectedBlockId}
                onChange={(e) => setSelectedBlockId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                disabled={!selectedSubjectId}
              >
                <option value="">Общий банк вопросов</option>
                {blocks.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Загрузка файла */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Или загрузите JSON файл
            </label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <FileText className="w-4 h-4" />
                Выбрать файл
              </label>
            </div>
          </div>

          {/* Текстовое поле для JSON */}
          <div>
            <label className="block text-sm font-medium mb-1">
              JSON с вопросами
            </label>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="w-full h-64 px-3 py-2 border rounded-lg font-mono text-sm"
              placeholder='[
  {
    "questionText": "Ваш вопрос...",
    "optionA": "Вариант A",
    "optionB": "Вариант B",
    "optionC": "Вариант C",
    "optionD": "Вариант D",
    "optionE": "",
    "correctAnswer": "A",
    "explanation": "",
    "difficulty": "MEDIUM",
    "tags": []
  }
]'
            />
          </div>

          {/* Кнопка импорта */}
          <div className="flex justify-end">
            <Button 
              onClick={handleImport} 
              disabled={isImporting || !selectedSubjectId || !jsonInput.trim()}
              className="min-w-[200px]"
            >
              {isImporting ? (
                <>Импортирование...</>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Импортировать
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Информация о формате */}
      <Card className="p-6">
        <h3 className="font-semibold mb-3">Формат JSON:</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <pre className="text-xs overflow-x-auto">
{`{
  "questionText": "Текст вопроса (обязательно)",
  "optionA": "Вариант A (обязательно)",
  "optionB": "Вариант B (обязательно)",
  "optionC": "Вариант C (обязательно)",
  "optionD": "Вариант D (обязательно)",
  "optionE": "Вариант E (необязательно)",
  "correctAnswer": "A" | "B" | "C" | "D" | "E" (обязательно),
  "explanation": "Объяснение ответа (необязательно)",
  "difficulty": "EASY" | "MEDIUM" | "HARD" (по умолчанию MEDIUM),
  "tags": ["тег1", "тег2"] (необязательно),
  "questionImage": "URL изображения (необязательно)"
}`}
          </pre>
        </div>
      </Card>

      {/* Альтернативный способ */}
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <h3 className="font-semibold text-yellow-900 mb-2">
          📩 Альтернативный способ
        </h3>
        <p className="text-sm text-yellow-800">
          Если у вас есть вопросы в другом формате (Excel, Word, PDF и т.д.), 
          скиньте мне файл, и я конвертирую его в нужный JSON формат для импорта!
        </p>
      </Card>
    </div>
  );
}
