'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { spacesApi, bookingsApi } from '@/lib/api-client';
import { useAuth } from '@/providers/auth-provider';
import { Header } from '@/components/header';
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
import { formatCurrency, formatDate } from '@/lib/utils';
import { MapPin, Calendar, ArrowLeft, User, MessageCircle } from 'lucide-react';
import dynamic from 'next/dynamic';

const SpaceMap = dynamic(() => import('@/components/space-map'), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-muted rounded-lg animate-pulse" />,
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

export default function SpaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');

  const { data: space, isLoading } = useQuery({
    queryKey: ['space', params.id],
    queryFn: () => spacesApi.get(params.id as string),
    enabled: !!params.id,
  });

  const createBooking = useMutation({
    mutationFn: (data: { spaceId: string; startDate: string; endDate: string; message?: string }) =>
      bookingsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      toast({
        title: 'Booking request sent!',
        description: 'The space owner will review your request.',
      });
      router.push('/bookings');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Booking failed',
        description: error.message,
      });
    },
  });

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!space) return;

    if (!startDate || !endDate) {
      toast({
        variant: 'destructive',
        title: 'Invalid dates',
        description: 'Please select both start and end dates.',
      });
      return;
    }

    createBooking.mutate({
      spaceId: space.id,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      message: message || undefined,
    });
  };

  const calculateTotal = () => {
    if (!startDate || !endDate || !space) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days * space.price : 0;
  };

  const isOwnSpace = user?.id === space?.ownerId;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="h-64 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </main>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Space not found</h1>
          <Button asChild>
            <Link href="/spaces">Back to Spaces</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/spaces">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Spaces
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Image */}
            <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center overflow-hidden">
              {space.imageUrls && space.imageUrls.length > 0 && space.imageUrls[0] ? (
                <img
                  src={space.imageUrls[0].startsWith('/') ? `${API_URL}${space.imageUrls[0]}` : space.imageUrls[0]}
                  alt={space.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <MapPin className="h-24 w-24 text-primary/40" />
              )}
            </div>

            {/* Details */}
            <div>
              <h1 className="text-3xl font-bold mb-2">{space.title}</h1>
              {space.location && (
                <div className="flex items-center text-muted-foreground mb-4">
                  <MapPin className="h-5 w-5 mr-2" />
                  {space.location}
                </div>
              )}
              <p className="text-2xl font-bold text-primary mb-6">
                {formatCurrency(space.price)}
                <span className="text-base font-normal text-muted-foreground">
                  {' '}
                  per day
                </span>
              </p>
            </div>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About this space</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {space.description || 'No description provided.'}
                </p>
              </CardContent>
            </Card>

            {/* Owner Info */}
            {space.owner && (
              <Card>
                <CardHeader>
                  <CardTitle>Listed by</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{space.owner.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Member since {formatDate(space.createdAt)}
                      </p>
                    </div>
                  </div>
                  {isAuthenticated && !isOwnSpace && (
                    <Button
                      variant="outline"
                      className="w-full"
                      asChild
                    >
                      <Link href={`/messages?userId=${space.ownerId}`}>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Contact Owner
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Map Location */}
            {space.latitude && space.longitude && (
              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <SpaceMap
                    spaces={[{
                      id: space.id,
                      title: space.title,
                      location: space.location,
                      latitude: space.latitude,
                      longitude: space.longitude,
                      price: String(space.price),
                    }]}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Book this space</CardTitle>
                <CardDescription>
                  Select your dates to request a booking
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isAuthenticated ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-4">
                      Please log in to book this space
                    </p>
                    <Button asChild className="w-full">
                      <Link href="/login">Log in</Link>
                    </Button>
                  </div>
                ) : isOwnSpace ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-4">
                      This is your space
                    </p>
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/my-spaces/${space.id}/edit`}>Edit Space</Link>
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleBooking} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message (optional)</Label>
                      <Input
                        id="message"
                        placeholder="Tell the owner about your advertising needs..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                    </div>
                    {startDate && endDate && calculateTotal() > 0 && (
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-muted-foreground">
                            {formatCurrency(space.price)} x{' '}
                            {Math.ceil(
                              (new Date(endDate).getTime() - new Date(startDate).getTime()) /
                                (1000 * 60 * 60 * 24)
                            )}{' '}
                            days
                          </span>
                          <span>{formatCurrency(calculateTotal())}</span>
                        </div>
                        <div className="flex justify-between items-center font-bold text-lg">
                          <span>Total</span>
                          <span>{formatCurrency(calculateTotal())}</span>
                        </div>
                      </div>
                    )}
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createBooking.isPending}
                    >
                      {createBooking.isPending ? 'Sending request...' : 'Request Booking'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
