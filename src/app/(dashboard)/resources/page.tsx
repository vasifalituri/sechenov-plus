import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface ExternalResource {
  id: string;
  title: string;
  description?: string;
  url: string;
  icon: string;
  order: number;
}

async function getExternalResources(): Promise<ExternalResource[]> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/resources`, {
      cache: 'no-store', // Always fetch fresh data
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch resources');
    }
    
    const data = await response.json();
    return data.success ? data.data : [];
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
                <div className="text-4xl mb-2">{resource.icon}</div>
                <CardTitle className="text-lg">{resource.title}</CardTitle>
                {resource.description && (
                  <CardDescription>{resource.description}</CardDescription>
                )}
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
          <CardTitle className="text-lg">💡 Информация</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Здесь вы найдете полезные ссылки на внешние ресурсы: Google Drive, Яндекс.Диск, 
            облачные хранилища с дополнительными материалами для обучения.
          </p>
          <p className="mt-2">
            <strong>Для администраторов:</strong> управление ресурсами доступно в{' '}
            <a href="/admin/resources" className="text-blue-600 hover:underline">
              панели администратора
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
