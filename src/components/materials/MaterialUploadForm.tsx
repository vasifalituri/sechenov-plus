'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { supabase, STORAGE_BUCKET, isSupabaseConfigured } from '@/lib/supabase';
import { validateFile } from '@/lib/file-validator';
import { compressFile, formatFileSize, type CompressionResult } from '@/lib/file-compression';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SubjectSelect } from '@/components/ui/subject-select';

const MAX_FILE_SIZE_USER = 10 * 1024 * 1024; // 10MB for regular users
const MAX_FILE_SIZE_ADMIN = 500 * 1024 * 1024; // 500MB for admins
const MAX_SUPABASE_SIZE = 10 * 1024 * 1024; // Use Supabase for files up to 10MB (Vercel has 4.5MB payload limit)

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

export function MaterialUploadForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  
  // Determine max file size based on user role
  const isAdmin = session?.user?.role === 'ADMIN';
  const MAX_FILE_SIZE = isAdmin ? MAX_FILE_SIZE_ADMIN : MAX_FILE_SIZE_USER;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    academicYear: session?.user?.academicYear || 1,
    tags: [] as string[],
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressionEnabled, setCompressionEnabled] = useState(true);
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [willUseExternalStorage, setWillUseExternalStorage] = useState(false);

  // Fetch subjects on mount
  useEffect(() => {
    fetch('/api/subjects')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setSubjects(data.data);
        }
      })
      .catch((err) => console.error('Failed to load subjects:', err));
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Недопустимый тип файла. Разрешены только PDF и DOCX.');
      e.target.value = '';
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`Файл слишком большой. Максимальный размер: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      e.target.value = '';
      return;
    }

    // Validate magic bytes (client-side check)
    try {
      const buffer = await file.arrayBuffer();
      const validation = validateFile(Buffer.from(buffer), file.type, file.name, MAX_FILE_SIZE);
      
      if (!validation.valid) {
        toast.error(validation.error || 'Невалидный файл');
        e.target.value = '';
        return;
      }
    } catch (error) {
      console.error('File validation error:', error);
      toast.error('Ошибка валидации файла');
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    setCompressionResult(null); // Reset compression when new file selected
    
    // Use Supabase for all files (MEGA upload blocked by Vercel 4.5MB limit)
    const needsExternalStorage = false; // Use Supabase Storage instead of MEGA
    setWillUseExternalStorage(needsExternalStorage);
    
    toast.success(`Файл выбран: ${file.name} (${formatFileSize(file.size)}) - будет загружен в Supabase`, { duration: 5000 });

    // No compression for MEGA uploads
    // Files are uploaded as-is to MEGA
  };

  const handleCompress = async (file: File) => {
    setIsCompressing(true);
    toast.loading('Оптимизация файла...', { id: 'compress' });

    try {
      const result = await compressFile(file);
      setCompressionResult(result);

      if (result.shouldUseCompressed) {
        toast.success(
          `Файл оптимизирован! Сэкономлено ${result.compressionRatio.toFixed(1)}%`,
          { id: 'compress' }
        );
      } else {
        toast.success('Оптимизация завершена (будет использован оригинальный файл)', { id: 'compress' });
      }
    } catch (error) {
      console.error('Compression error:', error);
      toast.error('Ошибка оптимизации. Будет использован оригинальный файл.', { id: 'compress' });
    } finally {
      setIsCompressing(false);
    }
  };

  const uploadToSupabase = async (file: File): Promise<{ url: string; path: string }> => {
    if (!supabase) {
      throw new Error('Supabase не настроен');
    }
    
    // Create unique file path
    const timestamp = Date.now();
    const userId = session?.user?.id || 'anonymous';
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `user-${userId}/${timestamp}-${sanitizedName}`;

    // Upload file directly to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      // Check if it's a configuration error
      if (error.message.includes('Failed to fetch') || error.message.includes('Invalid URL')) {
        throw new Error(
          'Supabase не настроен правильно. Пожалуйста:\n' +
          '1. Откройте QUICK_START.md\n' +
          '2. Следуйте инструкциям настройки (5 минут)\n' +
          '3. Перезапустите сервер после обновления .env.local'
        );
      }
      throw new Error(`Ошибка загрузки: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    return {
      url: urlData.publicUrl,
      path: storagePath,
    };
  };

  const uploadToExternalStorage = async (file: File): Promise<{ url: string; fileName: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/materials/external-upload', {
      method: 'POST',
      body: formData,
    });

    // Handle non-JSON responses (e.g., HTML error pages)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Non-JSON response received:', await response.text());
      throw new Error('Ошибка сервера. MEGA Storage не настроен или недоступен.');
    }

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Ошибка загрузки во внешнее хранилище');
    }

    return {
      url: result.data.externalUrl,
      fileName: result.data.fileName,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error('Пожалуйста, выберите файл');
      return;
    }

    if (!formData.title || !formData.subjectId) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    setIsUploading(true);
    const loadingToast = toast.loading('Загрузка файла...');

    try {
      let fileUrl: string;
      let storagePath: string;
      let storageType: 'SUPABASE' | 'EXTERNAL_MEGA' = 'SUPABASE';
      let storageBucket: string | undefined;
      let externalUrl: string | undefined;
      let fileToUpload: File;

      // Determine which file to upload (compressed or original)
      fileToUpload = compressionResult?.shouldUseCompressed 
        ? compressionResult.compressedFile 
        : selectedFile;

      if (willUseExternalStorage) {
        // Large file: Upload to MEGA
        toast.loading('Загрузка большого файла во внешнее хранилище (это может занять несколько минут)...', { id: loadingToast });
        
        const { url } = await uploadToExternalStorage(selectedFile); // Use original file for external storage
        
        fileUrl = url;
        storagePath = selectedFile.name; // Store filename as path for external
        storageType = 'EXTERNAL_MEGA';
        externalUrl = url;
      } else {
        // Small/medium file: Upload to Supabase Storage
        // Check if Supabase is configured
        if (!isSupabaseConfigured()) {
          toast.error('Supabase не настроен. Пожалуйста, добавьте SUPABASE_URL и ANON_KEY в .env.local');
          return;
        }

        toast.loading('Загрузка файла в Supabase хранилище...', { id: loadingToast });
        const { url, path } = await uploadToSupabase(fileToUpload);
        
        fileUrl = url;
        storagePath = path;
        storageType = 'SUPABASE';
        storageBucket = STORAGE_BUCKET;
      }

      // Step 2: Send metadata to backend API
      toast.loading('Сохранение метаданных...', { id: loadingToast });
      const response = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fileUrl: fileUrl,
          fileName: selectedFile.name,
          fileSize: fileToUpload.size,
          fileType: selectedFile.type,
          storagePath: storagePath,
          storageType: storageType,
          storageBucket: storageBucket,
          externalUrl: externalUrl,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // If API fails, try to clean up uploaded file (only for Supabase)
        if (storageType === 'SUPABASE' && supabase) {
          try {
            await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
          } catch (cleanupError) {
            console.error('Failed to cleanup file:', cleanupError);
          }
        }
        throw new Error(result.error || 'Ошибка сохранения метаданных');
      }

      toast.success(result.message || 'Материал успешно загружен!', { id: loadingToast });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        subjectId: '',
        academicYear: session?.user?.academicYear || 1,
        tags: [],
      });
      setSelectedFile(null);
      setWillUseExternalStorage(false);
      setCompressionResult(null);

      // Redirect to materials page
      setTimeout(() => {
        router.push('/materials');
      }, 1500);
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки';
      toast.error(errorMessage, { id: loadingToast });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Label htmlFor="title">Название материала *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Например: Лекция по Анатомии - Сердечно-сосудистая система"
          required
          disabled={isUploading}
        />
      </div>

      <div>
        <Label htmlFor="description">Описание</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Краткое описание материала..."
          rows={4}
          disabled={isUploading}
        />
      </div>

      <div>
        <Label htmlFor="subject">Предмет *</Label>
        <SubjectSelect
          value={formData.subjectId}
          onChange={(value) => setFormData({ ...formData, subjectId: value })}
          subjects={subjects}
        />
      </div>

      <div>
        <Label htmlFor="academicYear">Курс *</Label>
        <Select
          value={formData.academicYear.toString()}
          onValueChange={(value) => setFormData({ ...formData, academicYear: parseInt(value) })}
          disabled={isUploading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите курс" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5, 6].map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year} курс
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="file">
          Файл (PDF или DOCX, до {isAdmin ? '500MB' : '10MB'}) *
          {isAdmin && <span className="ml-2 text-xs text-cyan-600 dark:text-cyan-400 font-semibold">Админ: увеличенный лимит</span>}
        </Label>
        
        {/* Storage info */}
        <div className={`mb-2 p-2 rounded-md text-xs border ${
          isAdmin 
            ? 'bg-cyan-50 border-cyan-200 text-cyan-900 dark:bg-cyan-900/20 dark:border-cyan-700 dark:text-cyan-100' 
            : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-100'
        }`}>
          <p className="font-medium mb-1">📦 Хранилище материалов:</p>
          <ul className="space-y-0.5 ml-4 list-disc">
            {isAdmin ? (
              <>
                <li>Файлы до 10MB → Supabase Storage (быстро)</li>
                <li>Файлы 10MB-500MB → MEGA Storage (для больших файлов)</li>
                <li>Максимальный размер: 500MB (администраторский доступ)</li>
              </>
            ) : (
              <>
                <li>Все учебные материалы → Supabase Storage (1GB бесплатно)</li>
                <li>Максимальный размер файла: 10MB</li>
                <li>Загрузка напрямую с браузера (быстро и безопасно)</li>
              </>
            )}
          </ul>
        </div>
        
        {/* Compression disabled for MEGA uploads */}

        <Input
          id="file"
          type="file"
          accept=".pdf,.docx,.doc"
          onChange={handleFileSelect}
          disabled={isUploading || isCompressing}
          required
        />
        
        {selectedFile && !compressionResult && !willUseExternalStorage && (
          <p className="text-sm text-green-600 mt-2">
            ✓ {selectedFile.name} ({formatFileSize(selectedFile.size)})
          </p>
        )}
        
        {willUseExternalStorage && selectedFile && (
          <div className="mt-3 p-3 bg-purple-50 rounded-md border border-purple-200">
            <div className="flex items-start gap-2">
              <div className="text-2xl">🌐</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-purple-900 mb-1">
                  Большой файл - внешнее хранилище
                </p>
                <div className="space-y-1 text-xs text-purple-700">
                  <div className="flex justify-between">
                    <span>Имя файла:</span>
                    <span className="font-medium">{selectedFile.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Размер:</span>
                    <span className="font-medium">{formatFileSize(selectedFile.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Хранилище:</span>
                    <span className="font-medium">MEGA (внешнее)</span>
                  </div>
                </div>
                <p className="text-xs text-purple-600 mt-2">
                  ℹ️ Файл будет загружен во внешнее хранилище MEGA. Загрузка может занять несколько минут.
                </p>
              </div>
            </div>
          </div>
        )}

        {isCompressing && (
          <div className="mt-2 text-sm text-blue-600">
            ⏳ Оптимизация файла...
          </div>
        )}

        {compressionResult && (
          <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  📊 Информация о файле
                </p>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Оригинальный размер:</span>
                    <span className="font-medium">{formatFileSize(compressionResult.originalSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>После оптимизации:</span>
                    <span className="font-medium text-green-600">
                      {formatFileSize(compressionResult.compressedSize)}
                    </span>
                  </div>
                  {compressionResult.shouldUseCompressed && (
                    <div className="flex justify-between pt-1 border-t border-gray-300">
                      <span className="font-medium">Экономия:</span>
                      <span className="font-medium text-green-600">
                        {compressionResult.compressionRatio.toFixed(1)}% 
                        ({formatFileSize(compressionResult.originalSize - compressionResult.compressedSize)})
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-2xl">
                {compressionResult.shouldUseCompressed ? '✅' : 'ℹ️'}
              </div>
            </div>
            {compressionResult.shouldUseCompressed && (
              <p className="text-xs text-green-700 mt-2">
                ✓ Будет загружен оптимизированный файл
              </p>
            )}
            {!compressionResult.shouldUseCompressed && (
              <p className="text-xs text-gray-600 mt-2">
                ℹ️ Оптимизация не дала значительного уменьшения. Будет загружен оригинальный файл.
              </p>
            )}
          </div>
        )}
      </div>

      {isUploading && (
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div className="bg-blue-600 h-4 rounded-full animate-pulse w-full">
            <span className="text-xs text-white flex items-center justify-center h-full">
              Загрузка...
            </span>
          </div>
        </div>
      )}

      <Button type="submit" disabled={isUploading || !selectedFile} className="w-full">
        {isUploading ? 'Загрузка...' : 'Загрузить материал'}
      </Button>

      <div className="text-sm text-gray-500 text-center space-y-2">
        <p>
          Файл будет загружен напрямую в облачное хранилище и проверен администратором перед публикацией.
        </p>
        {!isSupabaseConfigured() && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-yellow-800 text-left">
            <p className="font-semibold mb-1">⚠️ Supabase не настроен</p>
            <p className="text-xs">
              Для загрузки файлов нужно настроить Supabase Storage.
              <br />
              Инструкция: <code className="bg-yellow-100 px-1 py-0.5 rounded">QUICK_START.md</code> (5 минут)
            </p>
          </div>
        )}
      </div>
    </form>
  );
}
