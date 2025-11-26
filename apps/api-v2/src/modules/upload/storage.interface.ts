export interface UploadedFile {
  originalName: string;
  filename: string;
  path: string;
  url: string;
  thumbnailUrl: string;
  size: number;
  mimeType: string;
}

export interface ImageProcessingOptions {
  width: number;
  height: number;
  quality: number;
  format: 'webp' | 'jpeg' | 'png';
}

export interface StorageService {
  /**
   * Upload and process an image file
   * @param file - The uploaded file buffer
   * @param originalName - Original filename
   * @returns Processed file information with URLs
   */
  uploadImage(file: Buffer, originalName: string): Promise<UploadedFile>;

  /**
   * Delete an uploaded file and its thumbnail
   * @param filename - The filename to delete
   */
  deleteFile(filename: string): Promise<void>;

  /**
   * Get the public URL for a file
   * @param filename - The filename
   */
  getUrl(filename: string): string;

  /**
   * Get the thumbnail URL for a file
   * @param filename - The filename
   */
  getThumbnailUrl(filename: string): string;
}

export const STORAGE_SERVICE = 'STORAGE_SERVICE';
