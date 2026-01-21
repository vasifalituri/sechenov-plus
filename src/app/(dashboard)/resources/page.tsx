import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface ExternalResource {
  id: string;
  title: string;
  description: string;
  url: string;
  type: string;
  icon: string;
  active: boolean;
}

async function getExternalResources(): Promise<ExternalResource[]> {
  try {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), 'public', 'external-resources.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const resources = JSON.parse(fileContent);
    return resources.filter((r: ExternalResource) => r.active);
  } catch (error) {
    console.error('Failed to load external resources:', error);
    return [];
  }
}

export default async function ResourcesPage() {
  const resources = await getExternalResources();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Полезные ресурсы</h1>
        <p className="text-muted-foreground mt-2">
          Дополнительные материалы, группы и каналы для студентов
        </p>
      </div>

      {resources.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-lg font-medium mb-2">Ресурсов пока нет</p>
            <p className="text-muted-foreground text-center text-sm">
              Администратор скоро добавит полезные ссылки
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource) => (
            <Card key={resource.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="text-4xl mb-2">{resource.icon}</div>
                  <Badge variant="outline" className="capitalize">
                    {resource.type}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{resource.title}</CardTitle>
                <CardDescription>{resource.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Перейти к ресурсу
                  </Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">💡 Как добавить ресурс?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Для администраторов:</strong> Отредактируйте файл{' '}
            <code className="bg-muted px-2 py-1 rounded">public/external-resources.json</code>
          </p>
          <p>Добавьте новый объект со следующими полями:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li><code>id</code>: уникальный идентификатор</li>
            <li><code>title</code>: название ресурса</li>
            <li><code>description</code>: краткое описание</li>
            <li><code>url</code>: ссылка на ресурс</li>
            <li><code>type</code>: тип (yandex, mega, google, telegram, vk, и т.д.)</li>
            <li><code>icon</code>: эмодзи для иконки</li>
            <li><code>active</code>: true или false</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
