'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Camera, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageCropModal } from './ImageCropModal';
import toast from 'react-hot-toast';

interface ProfileImageUploadProps {
  currentImage: string | null;
  userName: string;
  onImageUpdate: (newImageUrl: string | null) => void;
}

export function ProfileImageUpload({ 
  currentImage, 
  userName,
  onImageUpdate 
}: ProfileImageUploadProps) {
  const { data: session, update } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Неверный формат файла. Разрешены только JPEG, PNG и WebP.');
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Размер файла слишком большой. Максимальный размер 5MB.');
      return;
    }

    // Read file as data URL for cropper
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', croppedImageBlob, 'profile-image.jpg');

      const response = await fetch('/api/users/profile-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Фото профиля успешно обновлено!');
        onImageUpdate(data.data.profileImage);
        // Update session with new profile image
        await update({ profileImage: data.data.profileImage });
      } else {
        toast.error(data.error || 'Не удалось загрузить фото');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Произошла ошибка при загрузке фото');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentImage) return;

    if (!confirm('Вы уверены, что хотите удалить фото профиля?')) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch('/api/users/profile-image', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Фото профиля удалено');
        onImageUpdate(null);
        // Update session to remove profile image
        await update({ profileImage: null });
      } else {
        toast.error(data.error || 'Не удалось удалить фото');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Произошла ошибка при удалении фото');
    } finally {
      setIsDeleting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <div className="flex flex-col items-center gap-3 sm:gap-4">
        <div className="relative">
          <Avatar className="w-24 h-24 sm:w-32 sm:h-32">
            <AvatarImage src={currentImage || undefined} alt={userName} />
            <AvatarFallback className="text-xl sm:text-2xl">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-stretch sm:items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isDeleting}
            className="touch-manipulation w-full sm:w-auto"
            type="button"
          >
            <Camera className="w-4 h-4 mr-2" />
            {currentImage ? 'Изменить фото' : 'Загрузить фото'}
          </Button>

          {currentImage && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isUploading || isDeleting}
              className="touch-manipulation w-full sm:w-auto"
              type="button"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          {...({ capture: 'environment' } as any)}
          onChange={handleFileChange}
          className="hidden"
          aria-label="Выбрать фото профиля"
        />

        <p className="text-xs text-muted-foreground text-center">
          Форматы: JPG, PNG, WebP. Макс. размер: 5MB
        </p>
      </div>

      {/* Image Crop Modal */}
      {imageToCrop && (
        <ImageCropModal
          isOpen={isCropModalOpen}
          imageSrc={imageToCrop}
          onClose={() => {
            setIsCropModalOpen(false);
            setImageToCrop(null);
          }}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}
