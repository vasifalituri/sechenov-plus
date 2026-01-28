'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatFileSize, getStatusLabel, getStatusColor } from '@/lib/utils';
import { Check, X, Trash2, Download, Cloud, HardDrive, ExternalLink, RefreshCw } from 'lucide-react';
import { getStaffBadge, getStaffColorClass } from '@/lib/permissions';

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('PENDING');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await fetch('/api/admin/materials');
      const data = await response.json();
      if (data.success) {
        setMaterials(data.data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (materialId: string, status: string) => {
    try {
      const response = await fetch('/api/admin/materials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialId, status }),
      });

      const data = await response.json();
      if (data.success) {
        fetchMaterials();
        alert(data.message);
      }
    } catch (error) {
      console.error('Error updating material:', error);
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот материал?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/materials?materialId=${materialId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        fetchMaterials();
        alert(data.message);
      }
    } catch (error) {
      console.error('Error deleting material:', error);
    }
  };

  const handleMigrateToMega = async (materialId: string) => {
    if (!confirm('Перенести этот файл в MEGA хранилище?')) {
      return;
    }

    try {
      const response = await fetch('/api/materials/migrate-to-mega', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialId }),
      });

      const data = await response.json();
      if (data.success) {
        fetchMaterials();
        alert('Файл успешно перенесён в MEGA!');
      } else {
        alert(`Ошибка: ${data.error}`);
      }
    } catch (error) {
      console.error('Error migrating to MEGA:', error);
      alert('Ошибка при переносе в MEGA');
    }
  };

  const handleDownload = async (materialId: string, storageType: string) => {
    try {
      const response = await fetch(`/api/materials/download/${materialId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        // MEGA file - open in new tab
        const data = await response.json();
        if (data.success && data.externalUrl) {
          window.open(data.externalUrl, '_blank', 'noopener,noreferrer');
        } else {
          alert('Ошибка: не удалось получить ссылку для скачивания');
        }
      } else {
        // Regular download - get filename from response headers or use from material data
        const contentDisposition = response.headers.get('content-disposition');
        let fileName = 'material';
        
        if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (fileNameMatch && fileNameMatch[1]) {
            fileName = fileNameMatch[1].replace(/['"]/g, '');
          }
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading:', error);
      alert(`Ошибка при скачивании: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

  const filteredMaterials = materials.filter((material) => {
    if (filter === 'ALL') return true;
    return material.status === filter;
  });

  const stats = {
    all: materials.length,
    pending: materials.filter((m) => m.status === 'PENDING').length,
    approved: materials.filter((m) => m.status === 'APPROVED').length,
    rejected: materials.filter((m) => m.status === 'REJECTED').length,
  };

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Модерация материалов</h2>
          <p className="text-muted-foreground mt-2">
            Проверяйте и одобряйте загруженные материалы
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Обновлено: {lastUpdated.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMaterials}
            disabled={isLoading}
            title="Обновить список"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="cursor-pointer" onClick={() => setFilter('ALL')}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.all}</div>
            <p className="text-sm text-muted-foreground">Всего</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setFilter('PENDING')}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">На модерации</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setFilter('APPROVED')}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-sm text-muted-foreground">Одобрено</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setFilter('REJECTED')}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-sm text-muted-foreground">Отклонено</p>
          </CardContent>
        </Card>
      </div>

      {/* Materials Table */}
      <Card>
        <CardHeader>
          <CardTitle>Материалы</CardTitle>
          <CardDescription>
            Показано {filteredMaterials.length} из {materials.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredMaterials.map((material) => (
              <div
                key={material.id}
                className="flex items-start justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{material.subject.name}</Badge>
                    <Badge variant="outline">{material.academicYear} курс</Badge>
                    <Badge variant="outline">{material.fileType}</Badge>
                    {material.storageType === 'EXTERNAL_MEGA' ? (
                      <Badge variant="default" className="bg-purple-600">
                        <Cloud className="w-3 h-3 mr-1" />
                        MEGA
                      </Badge>
                    ) : (
                      <Badge variant="default" className="bg-blue-600">
                        <HardDrive className="w-3 h-3 mr-1" />
                        Supabase
                      </Badge>
                    )}
                  </div>
                  <h4 className="font-medium mb-1">{material.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {material.description || 'Без описания'}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      Загрузил:{' '}
                      <a 
                        href={`/users/${material.uploadedBy.username}`}
                        className="flex items-center gap-1"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {getStaffBadge(material.uploadedBy.role) && (
                          <span className="text-xs" title={getStaffBadge(material.uploadedBy.role)?.label}>
                            {getStaffBadge(material.uploadedBy.role)?.icon}
                          </span>
                        )}
                        <span className={`hover:underline font-medium ${getStaffColorClass(material.uploadedBy.role) || 'text-blue-600 dark:text-blue-400'}`}>
                          @{material.uploadedBy.username}
                        </span>
                      </a>
                    </span>
                    <span>•</span>
                    <span>Размер: {formatFileSize(material.fileSize)}</span>
                    <span>•</span>
                    <span>{formatDate(material.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Badge className={getStatusColor(material.status)}>
                    {getStatusLabel(material.status)}
                  </Badge>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(material.id, material.storageType)}
                    title={material.storageType === 'EXTERNAL_MEGA' ? 'Открыть в MEGA' : 'Скачать'}
                  >
                    {material.storageType === 'EXTERNAL_MEGA' ? (
                      <ExternalLink className="w-4 h-4" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </Button>

                  {material.storageType === 'SUPABASE' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMigrateToMega(material.id)}
                      title="Перенести в MEGA"
                    >
                      <Cloud className="w-4 h-4" />
                    </Button>
                  )}

                  {material.status === 'PENDING' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(material.id, 'APPROVED')}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleUpdateStatus(material.id, 'REJECTED')}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteMaterial(material.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {filteredMaterials.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Материалов не найдено
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
