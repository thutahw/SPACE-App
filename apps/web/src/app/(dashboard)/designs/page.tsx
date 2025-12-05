'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { designsApi, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

const statusColors: Record<string, string> = {
  PENDING_REVIEW: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  REVISION_REQUESTED: 'bg-orange-100 text-orange-800',
};

const statusLabels: Record<string, string> = {
  PENDING_REVIEW: 'Pending Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  REVISION_REQUESTED: 'Revision Requested',
};

export default function DesignsPage() {
  const queryClient = useQueryClient();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const { data: designs, isLoading } = useQuery({
    queryKey: ['designs'],
    queryFn: () => designsApi.list(),
  });

  const uploadMutation = useMutation({
    mutationFn: (params: { file: File; name: string; description: string }) =>
      designsApi.upload(params.file, {
        name: params.name,
        description: params.description,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designs'] });
      toast({
        title: 'Design uploaded',
        description: 'Your design has been submitted for review.',
      });
      setIsUploadOpen(false);
      setUploadFile(null);
      setUploadName('');
      setUploadDescription('');
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : 'Failed to upload design';
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => designsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designs'] });
      toast({
        title: 'Design deleted',
        description: 'Your design has been removed.',
      });
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : 'Failed to delete design';
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: message,
      });
    },
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setUploadFile(file);
        if (!uploadName) {
          setUploadName(file.name.replace(/\.[^/.]+$/, ''));
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: 'Please upload an image file.',
        });
      }
    }
  }, [uploadName]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      if (!uploadName) {
        setUploadName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = () => {
    if (!uploadFile) {
      toast({
        variant: 'destructive',
        title: 'No file selected',
        description: 'Please select a file to upload.',
      });
      return;
    }

    uploadMutation.mutate({
      file: uploadFile,
      name: uploadName || uploadFile.name,
      description: uploadDescription,
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Designs</h1>
          <p className="text-muted-foreground">
            Upload and manage your advertising designs
          </p>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Upload Design
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload Design</DialogTitle>
              <DialogDescription>
                Upload your advertising design for review. Supported formats: JPG, PNG, WebP.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {uploadFile ? (
                  <div className="space-y-2">
                    <div className="mx-auto w-32 h-32 relative rounded-lg overflow-hidden bg-muted">
                      <img
                        src={URL.createObjectURL(uploadFile)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-sm font-medium">{uploadFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadFile.size)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploadFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <svg
                      className="mx-auto h-12 w-12 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-sm text-muted-foreground">
                      Drag and drop your design here, or
                    </p>
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-primary hover:underline">browse</span>
                      <Input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </Label>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Design Name</Label>
                <Input
                  id="name"
                  placeholder="Enter a name for your design"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your design..."
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!uploadFile || uploadMutation.isPending}
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Upload Design'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-video bg-muted" />
              <CardHeader>
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2 mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : designs && designs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {designs.map((design) => (
            <Card key={design.id} className="overflow-hidden">
              <div className="aspect-video relative bg-muted">
                {design.thumbnailUrl || design.fileUrl ? (
                  <img
                    src={`${API_URL}${design.thumbnailUrl || design.fileUrl}`}
                    alt={design.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <svg
                      className="h-12 w-12 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      statusColors[design.status] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {statusLabels[design.status] || design.status}
                  </span>
                </div>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg line-clamp-1">
                  {design.name}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {design.description || 'No description'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{formatFileSize(design.fileSize)}</span>
                  <span>
                    {new Date(design.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {design.reviewNotes && (
                  <div className="mt-3 p-2 bg-muted rounded-md">
                    <p className="text-xs font-medium text-muted-foreground">
                      Review Notes:
                    </p>
                    <p className="text-sm">{design.reviewNotes}</p>
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                  >
                    <a
                      href={`${API_URL}${design.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Full Size
                    </a>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate(design.id)}
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <svg
              className="h-8 w-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium">No designs yet</h3>
          <p className="text-muted-foreground mt-1">
            Upload your first design to get started with advertising on SPACE.
          </p>
          <Button className="mt-4" onClick={() => setIsUploadOpen(true)}>
            Upload Your First Design
          </Button>
        </Card>
      )}
    </div>
  );
}
