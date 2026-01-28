'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';

interface DownloadButtonProps {
  materialId: string;
  fileName: string;
  storageType?: string;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function DownloadButton({
  materialId,
  fileName,
  storageType,
  className,
  size = 'lg',
}: DownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/materials/download/${materialId}`);
      
      // Check if response is JSON (MEGA file)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
        if (data.success && data.downloadType === 'EXTERNAL_MEGA') {
          // Create a temporary link element and click it
          // This works better on mobile browsers
          const link = document.createElement('a');
          link.href = data.externalUrl;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          console.error('Unexpected response:', data);
          alert('Ошибка при скачивании файла');
        }
      } else {
        // Regular file download (Supabase/Local)
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
      console.error('Download error:', error);
      alert('Ошибка при скачивании файла');
    } finally {
      setIsLoading(false);
    }
  };

  const isMegaFile = storageType === 'EXTERNAL_MEGA';

  return (
    <Button
      size={size}
      className={className}
      onClick={handleDownload}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Загрузка...
        </>
      ) : isMegaFile ? (
        <>
          <ExternalLink className="w-5 h-5 mr-2" />
          Скачать с MEGA
        </>
      ) : (
        <>
          <Download className="w-5 h-5 mr-2" />
          Скачать материал
        </>
      )}
    </Button>
  );
}
