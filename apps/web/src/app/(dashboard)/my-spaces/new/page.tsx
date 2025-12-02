'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
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

export default function NewSpacePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);

  const createSpace = useMutation({
    mutationFn: (data: { title: string; description?: string; price: number; location?: string; latitude?: number; longitude?: number; imageUrls?: string[] }) =>
      spacesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-spaces'] });
      toast({
        title: 'Space created!',
        description: 'Your space has been listed successfully.',
      });
      router.push('/my-spaces');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to create space',
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

    const lat = latitude ? parseFloat(latitude) : undefined;
    const lng = longitude ? parseFloat(longitude) : undefined;

    createSpace.mutate({
      title,
      description: description || undefined,
      price: priceNum,
      location: location || undefined,
      latitude: lat,
      longitude: lng,
      imageUrls: images.length > 0 ? images.map((img) => img.url) : undefined,
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/my-spaces">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Spaces
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>List a New Space</CardTitle>
          <CardDescription>
            Fill in the details about your advertising space
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Prime Window Display in Downtown"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Describe your advertising space, foot traffic, visibility, etc."
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
                placeholder="100.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., San Francisco, CA"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="e.g., 37.7749"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="e.g., -122.4194"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Optional: Add coordinates to display your space on the map. You can find these on Google Maps.
            </p>

            <div className="space-y-2">
              <Label>Images</Label>
              <ImageUpload
                value={images}
                onChange={setImages}
                maxImages={5}
                disabled={createSpace.isPending}
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
                disabled={createSpace.isPending}
              >
                {createSpace.isPending ? 'Creating...' : 'Create Space'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
