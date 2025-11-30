'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { uploadApi, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

export interface UploadedImage {
  url: string;
  thumbnailUrl: string;
  filename: string;
}

interface ImageUploadProps {
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  disabled?: boolean;
  className?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

export function ImageUpload({
  value = [],
  onChange,
  maxImages = 5,
  disabled = false,
  className,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const remainingSlots = maxImages - value.length;
      if (remainingSlots <= 0) {
        toast({
          variant: 'destructive',
          title: 'Maximum images reached',
          description: `You can only upload up to ${maxImages} images.`,
        });
        return;
      }

      const filesToUpload = Array.from(files).slice(0, remainingSlots);

      // Validate file types
      const validFiles = filesToUpload.filter((file) => {
        if (!file.type.startsWith('image/')) {
          toast({
            variant: 'destructive',
            title: 'Invalid file type',
            description: `${file.name} is not an image file.`,
          });
          return false;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast({
            variant: 'destructive',
            title: 'File too large',
            description: `${file.name} exceeds the 10MB limit.`,
          });
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      setIsUploading(true);

      try {
        const uploadedImages = await Promise.all(
          validFiles.map(async (file) => {
            const result = await uploadApi.uploadImage(file);
            return {
              url: result.url,
              thumbnailUrl: result.thumbnailUrl,
              filename: result.filename,
            };
          })
        );

        onChange([...value, ...uploadedImages]);

        toast({
          title: 'Images uploaded',
          description: `Successfully uploaded ${uploadedImages.length} image(s).`,
        });
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : 'Failed to upload images. Please try again.';
        toast({
          variant: 'destructive',
          title: 'Upload failed',
          description: message,
        });
      } finally {
        setIsUploading(false);
      }
    },
    [value, onChange, maxImages]
  );

  const handleRemove = useCallback(
    async (index: number) => {
      const imageToRemove = value[index];
      if (!imageToRemove) return;

      const newImages = value.filter((_, i) => i !== index);
      onChange(newImages);

      // Optionally delete from server
      try {
        await uploadApi.deleteImage(imageToRemove.filename);
      } catch {
        // Ignore deletion errors - image is already removed from UI
      }
    },
    [value, onChange]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled || isUploading) return;
      handleUpload(e.dataTransfer.files);
    },
    [disabled, isUploading, handleUpload]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleUpload(e.target.files);
      // Reset input value to allow re-uploading the same file
      e.target.value = '';
    },
    [handleUpload]
  );

  const canUploadMore = value.length < maxImages && !disabled && !isUploading;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload area */}
      {canUploadMore && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            'relative border-2 border-dashed rounded-lg p-6 transition-colors',
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleInputChange}
            disabled={disabled || isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <div className="flex flex-col items-center gap-2 text-center">
            {isUploading ? (
              <>
                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drag and drop images here, or click to select
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, WebP up to 10MB each ({value.length}/{maxImages})
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Image previews */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {value.map((image, index) => (
            <div
              key={image.filename}
              className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted group"
            >
              <Image
                src={`${API_URL}${image.thumbnailUrl}`}
                alt={`Uploaded image ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              {!disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemove(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
