'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { spacesApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { ImageUpload, UploadedImage } from '@/components/image-upload';

export default function EditSpacePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [images, setImages] = useState<UploadedImage[]>([]);

  const { data: space, isLoading } = useQuery({
    queryKey: ['space', params.id],
    queryFn: () => spacesApi.get(params.id as string),
    enabled: !!params.id,
  });

  useEffect(() => {
    if (space) {
      setTitle(space.title);
      setDescription(space.description || '');
      setPrice(String(space.price));
      setLocation(space.location || '');
      setStatus(space.status);
      // Convert existing image URLs to UploadedImage format
      if (space.imageUrls && space.imageUrls.length > 0) {
        setImages(
          space.imageUrls.map((url: string, index: number) => ({
            url,
            thumbnailUrl: url, // Use same URL for thumbnail if not available
            filename: `existing-${index}`,
          }))
        );
      }
    }
  }, [space]);

  const updateSpace = useMutation({
    mutationFn: (data: {
      title?: string;
      description?: string;
      price?: number;
      location?: string;
      status?: string;
      imageUrls?: string[];
    }) => spacesApi.update(params.id as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-spaces'] });
      queryClient.invalidateQueries({ queryKey: ['space', params.id] });
      toast({
        title: 'Space updated!',
        description: 'Your changes have been saved.',
      });
      router.push('/my-spaces');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to update',
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid price',
        description: 'Please enter a valid price greater than 0.',
      });
      return;
    }

    updateSpace.mutate({
      title,
      description: description || undefined,
      price: priceNum,
      location: location || undefined,
      status,
      imageUrls: images.map((img) => img.url),
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold mb-4">Space not found</h1>
        <Button asChild>
          <Link href="/my-spaces">Back to My Spaces</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/my-spaces">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Spaces
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit Space</CardTitle>
          <CardDescription>Update your advertising space details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price per Day ($) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Images</Label>
              <ImageUpload
                value={images}
                onChange={setImages}
                maxImages={5}
                disabled={updateSpace.isPending}
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={updateSpace.isPending}
              >
                {updateSpace.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
