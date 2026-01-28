'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, FileText, MessageSquare, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { getStaffBadge, getStaffColorClass } from '@/lib/permissions';

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  content?: string;
  type: 'material' | 'discussion';
  subject?: string;
  uploadedBy?: string;
  author?: string;
  authorRole?: string;
  commentsCount?: number;
  url: string;
  createdAt: string;
}

interface SearchResults {
  materials: SearchResult[];
  discussions: SearchResult[];
  total: number;
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({
    materials: [],
    discussions: [],
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<'all' | 'materials' | 'discussions'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Keyboard shortcut for Escape only
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Perform search
  const performSearch = useCallback(async (searchQuery: string, type: string) => {
    if (searchQuery.length < 2) {
      setResults({ materials: [], discussions: [], total: 0 });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&type=${type}&limit=5`
      );
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Trigger search when debounced query changes
  useEffect(() => {
    performSearch(debouncedQuery, selectedType);
  }, [debouncedQuery, selectedType, performSearch]);

  // Navigation with keyboard
  const allResults = [...results.materials, ...results.discussions];
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % allResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allResults.length) % allResults.length);
    } else if (e.key === 'Enter' && allResults[selectedIndex]) {
      e.preventDefault();
      handleResultClick(allResults[selectedIndex]);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url);
    setIsOpen(false);
    setQuery('');
    setResults({ materials: [], discussions: [], total: 0 });
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
    setResults({ materials: [], discussions: [], total: 0 });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <Search className="w-4 h-4" />
        <span className="hidden md:inline">Поиск...</span>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Search Modal */}
      <div className="fixed inset-x-4 top-20 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl z-50 animate-in slide-in-from-top-4 duration-200">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b dark:border-gray-800">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Поиск материалов и обсуждений..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
            />
            {isLoading && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
            <button
              onClick={handleClose}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 px-4 py-2 border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <button
              onClick={() => setSelectedType('all')}
              className={cn(
                'px-3 py-1 text-sm rounded-md transition-colors',
                selectedType === 'all'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
              )}
            >
              Всё
            </button>
            <button
              onClick={() => setSelectedType('materials')}
              className={cn(
                'px-3 py-1 text-sm rounded-md transition-colors',
                selectedType === 'materials'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
              )}
            >
              Материалы
            </button>
            <button
              onClick={() => setSelectedType('discussions')}
              className={cn(
                'px-3 py-1 text-sm rounded-md transition-colors',
                selectedType === 'discussions'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
              )}
            >
              Обсуждения
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {query.length < 2 && (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Введите минимум 2 символа для поиска</p>
              </div>
            )}

            {query.length >= 2 && !isLoading && results.total === 0 && (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Ничего не найдено</p>
                <p className="text-xs mt-1">Попробуйте изменить запрос</p>
              </div>
            )}

            {/* Materials */}
            {results.materials.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Материалы ({results.materials.length})
                </div>
                {results.materials.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className={cn(
                      'w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left',
                      selectedIndex === index && 'bg-gray-50 dark:bg-gray-800'
                    )}
                  >
                    <FileText className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {result.title}
                      </p>
                      {result.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                          {result.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {result.subject && (
                          <Badge variant="secondary" className="text-xs">
                            {result.subject}
                          </Badge>
                        )}
                        {result.uploadedBy && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {result.uploadedBy}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Discussions */}
            {results.discussions.length > 0 && (
              <div className="py-2 border-t dark:border-gray-800">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Обсуждения ({results.discussions.length})
                </div>
                {results.discussions.map((result, index) => {
                  const actualIndex = results.materials.length + index;
                  return (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className={cn(
                        'w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left',
                        selectedIndex === actualIndex && 'bg-gray-50 dark:bg-gray-800'
                      )}
                    >
                      <MessageSquare className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {result.title}
                        </p>
                        {result.content && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                            {result.content}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {result.subject && (
                            <Badge variant="secondary" className="text-xs">
                              {result.subject}
                            </Badge>
                          )}
                          {result.author && (
                            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              {getStaffBadge(result.authorRole as any) && (
                                <span title={getStaffBadge(result.authorRole as any)?.label}>
                                  {getStaffBadge(result.authorRole as any)?.icon}
                                </span>
                              )}
                              <span className={getStaffColorClass(result.authorRole as any) || ''}>
                                {result.author}
                              </span>
                            </span>
                          )}
                          {result.commentsCount !== undefined && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {result.commentsCount} комм.
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded">↓</kbd>
                навигация
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded">Enter</kbd>
                выбрать
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded">Esc</kbd>
                закрыть
              </span>
            </div>
            {results.total > 0 && (
              <span>Найдено: {results.total}</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
