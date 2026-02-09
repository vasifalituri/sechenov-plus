'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

interface Subject {
  id: string;
  name: string;
  slug: string;
}

interface QuizBlock {
  id: string;
  title: string;
  description: string | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  questionCount: number;
  userAttempts: Array<{ score: number }>;
  bestScore: number | null;
  totalAttempts: number;
}

export default function CTSubjectBlocksClient({
  subjectSlug,
}: {
  subjectSlug?: string;
}) {
  const router = useRouter();
  const rawSlug = typeof subjectSlug === 'string' ? subjectSlug : '';
  const normalizedSlug = useMemo(() => {
    if (!rawSlug) return '';
    try {
      return decodeURIComponent(rawSlug).trim().toLowerCase();
    } catch {
      return rawSlug.trim().toLowerCase();
    }
  }, [rawSlug]);

  const [subject, setSubject] = useState<Subject | null>(null);
  const [blocks, setBlocks] = useState<QuizBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingBlockId, setStartingBlockId] = useState<string | null>(null);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedSlug]);

  async function load() {
    setLoading(true);
    try {
      const subjectsRes = await fetch('/api/subjects');
      if (!subjectsRes.ok) throw new Error('Failed to fetch subjects');
      const subjectsData = await subjectsRes.json();
      const list: any[] = Array.isArray(subjectsData) ? subjectsData : subjectsData.data;

      const candidates = new Set<string>();

      if (rawSlug) {
        candidates.add(rawSlug);
        candidates.add(rawSlug.trim());
        candidates.add(rawSlug.trim().toLowerCase());
      }
      if (normalizedSlug) {
        candidates.add(normalizedSlug);
        candidates.add(normalizedSlug.trim());
        candidates.add(normalizedSlug.trim().toLowerCase());
      }
      try {
        if (rawSlug) {
          candidates.add(decodeURIComponent(rawSlug).trim());
          candidates.add(decodeURIComponent(rawSlug).trim().toLowerCase());
        }
      } catch {}
      try {
        if (rawSlug) {
          candidates.add(encodeURIComponent(rawSlug).trim());
          candidates.add(encodeURIComponent(rawSlug).trim().toLowerCase());
        }
      } catch {}

      const found = list.find((s) => {
        const slug = String(s.slug || '').trim();
        return candidates.has(slug) || candidates.has(slug.toLowerCase());
      });
      if (!found) {
        toast.error('Дисциплина не найдена');
        router.push('/ct');
        return;
      }
      setSubject({ id: found.id, name: found.name, slug: found.slug });

      const blocksRes = await fetch(`/api/quiz/blocks?subjectId=${found.id}`);
      if (!blocksRes.ok) throw new Error('Failed to fetch blocks');
      const blocksData = await blocksRes.json();
      setBlocks(Array.isArray(blocksData) ? blocksData : blocksData.data);
    } catch (e) {
      console.error(e);
      toast.error('Не удалось загрузить блоки');
    } finally {
      setLoading(false);
    }
  }

  const startBlockQuiz = async (blockId: string) => {
    setStartingBlockId(blockId);
    try {
      const res = await fetch('/api/quiz/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'BLOCK', blockId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Ошибка запуска теста');
      }

      const data = await res.json();
      localStorage.setItem(`quiz_${data.attemptId}`, JSON.stringify(data));
      router.push(`/ct/take/${data.attemptId}`);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Не удалось начать блок');
    } finally {
      setStartingBlockId(null);
    }
  };

  if (loading || !subject) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-600">Загрузка...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{subject.name} — тематические блоки</h1>
          <p className="text-gray-600 mt-2">Выберите блок и начните тестирование</p>
        </div>
        <Button variant="outline" onClick={() => router.push(`/ct/${subject.slug}`)}>
          Назад
        </Button>
      </div>

      {blocks.length === 0 ? (
        <Card className="p-8 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600">Блоки для этой дисциплины пока не добавлены</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {blocks.map((block) => (
            <Card key={block.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{block.title}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        block.difficulty === 'EASY'
                          ? 'bg-green-100 text-green-600'
                          : block.difficulty === 'HARD'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-yellow-100 text-yellow-600'
                      }`}
                    >
                      {block.difficulty === 'EASY' ? 'Легкий' : block.difficulty === 'HARD' ? 'Сложный' : 'Средний'}
                    </span>
                  </div>

                  {block.description && <p className="text-gray-600 mb-3">{block.description}</p>}

                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>📝 {block.questionCount} вопросов</span>
                    {block.totalAttempts > 0 && (
                      <>
                        <span>👤 {block.totalAttempts} попыток</span>
                        {typeof (block as any).averageScore === 'number' && (
                          <span>⭐ Ср. балл: {(block as any).averageScore.toFixed(1)}%</span>
                        )}
                      </>
                    )}
                  </div>

                  {block.bestScore !== null && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-900">
                        🏆 Ваш лучший результат: <strong>{block.bestScore.toFixed(1)}%</strong>
                        {block.totalAttempts ? ` (${block.totalAttempts} попыток)` : ''}
                      </p>
                    </div>
                  )}
                </div>

                <Button onClick={() => startBlockQuiz(block.id)} disabled={startingBlockId === block.id}>
                  {startingBlockId === block.id ? 'Запуск...' : 'Начать'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
