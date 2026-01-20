'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface AdminTableProps<T> {
  title: string;
  description: string;
  fetchUrl: string;
  filters?: FilterOption[];
  defaultFilter?: string;
  renderRow: (item: T) => ReactNode;
  emptyMessage?: string;
}

export function AdminTable<T extends { id: string }>({
  title,
  description,
  fetchUrl,
  filters,
  defaultFilter = 'ALL',
  renderRow,
  emptyMessage = 'Нет данных для отображения',
}: AdminTableProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState(defaultFilter);

  useEffect(() => {
    fetchItems();
  }, [filter]);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const url = `${fetchUrl}${filter !== 'ALL' ? `?status=${filter}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setItems(data.data);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground mt-2">{description}</p>
      </div>

      {filters && (
        <div className="flex gap-2">
          {filters.map((option) => (
            <Button
              key={option.value}
              variant={filter === option.value ? 'default' : 'outline'}
              onClick={() => setFilter(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Список</CardTitle>
          <CardDescription>
            {filter !== 'ALL' ? `Фильтр: ${filter}` : 'Все записи'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">{emptyMessage}</p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id}>{renderRow(item)}</div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
