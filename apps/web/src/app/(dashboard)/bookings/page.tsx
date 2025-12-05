'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { bookingsApi, paymentsApi, conversationsApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Calendar, MapPin, Check, X, Clock, CreditCard, Loader2, MessageCircle } from 'lucide-react';

type TabType = 'my-bookings' | 'incoming';

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('my-bookings');
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: myBookings, isLoading: loadingMyBookings } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: bookingsApi.getMyBookings,
  });

  const { data: ownerBookings, isLoading: loadingOwnerBookings } = useQuery({
    queryKey: ['owner-bookings'],
    queryFn: bookingsApi.getOwnerBookings,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      bookingsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      toast({
        title: 'Booking updated',
        description: 'The booking status has been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: error.message,
      });
    },
  });

  const cancelBooking = useMutation({
    mutationFn: (id: string) => bookingsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      toast({
        title: 'Booking cancelled',
        description: 'Your booking has been cancelled.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Cancellation failed',
        description: error.message,
      });
    },
  });

  const initiatePayment = useMutation({
    mutationFn: (bookingId: string) =>
      paymentsApi.createCheckoutSession(
        bookingId,
        `${window.location.origin}/bookings?payment=success`,
        `${window.location.origin}/bookings?payment=cancelled`,
      ),
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Payment failed',
        description: error.message,
      });
    },
  });

  const startConversation = useMutation({
    mutationFn: (params: { participantId: string; spaceId: string; bookingId: string }) =>
      conversationsApi.create({
        participantId: params.participantId,
        spaceId: params.spaceId,
        bookingId: params.bookingId,
      }),
    onSuccess: (data) => {
      router.push(`/messages?conversation=${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to start conversation',
        description: error.message,
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'CANCELLED':
      case 'REJECTED':
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusBadge = (paymentStatus?: string) => {
    switch (paymentStatus) {
      case 'SUCCEEDED':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
            <Check className="h-3 w-3" /> Paid
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
            <Loader2 className="h-3 w-3 animate-spin" /> Processing
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
            <X className="h-3 w-3" /> Failed
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
            Refunded
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Bookings</h1>
        <p className="text-muted-foreground">
          Manage your bookings and requests
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'my-bookings'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('my-bookings')}
        >
          My Bookings
        </button>
        <button
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'incoming'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('incoming')}
        >
          Incoming Requests
          {ownerBookings && ownerBookings.filter((b) => b.status === 'PENDING').length > 0 && (
            <span className="ml-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
              {ownerBookings.filter((b) => b.status === 'PENDING').length}
            </span>
          )}
        </button>
      </div>

      {/* My Bookings Tab */}
      {activeTab === 'my-bookings' && (
        <div className="space-y-4">
          {loadingMyBookings ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-1/2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : myBookings && myBookings.length > 0 ? (
            myBookings.map((booking) => (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {booking.space?.title || 'Unknown Space'}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                      </CardDescription>
                    </div>
                    <span
                      className={`flex items-center gap-1 text-sm px-3 py-1 rounded-full ${getStatusClass(
                        booking.status
                      )}`}
                    >
                      {getStatusIcon(booking.status)}
                      {booking.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      {booking.space?.location && (
                        <p className="text-sm text-muted-foreground flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {booking.space.location}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <p className="font-semibold">
                          Total: {formatCurrency(booking.totalPrice)}
                        </p>
                        {(booking as any).paymentStatus && getPaymentStatusBadge((booking as any).paymentStatus)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/spaces/${booking.spaceId}`}>View Space</Link>
                      </Button>
                      {/* Message the space owner */}
                      {booking.space?.owner && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            startConversation.mutate({
                              participantId: booking.space!.owner!.id,
                              spaceId: booking.spaceId,
                              bookingId: booking.id,
                            })
                          }
                          disabled={startConversation.isPending}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                      )}
                      {/* Show Pay Now for confirmed bookings that need payment */}
                      {booking.status === 'CONFIRMED' &&
                       (!((booking as any).paymentStatus) || (booking as any).paymentStatus === 'PENDING' || (booking as any).paymentStatus === 'FAILED') && (
                        <Button
                          size="sm"
                          onClick={() => initiatePayment.mutate(booking.id)}
                          disabled={initiatePayment.isPending}
                        >
                          {initiatePayment.isPending ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <CreditCard className="h-4 w-4 mr-1" />
                          )}
                          Pay Now
                        </Button>
                      )}
                      {booking.status === 'PENDING' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => cancelBooking.mutate(booking.id)}
                          disabled={cancelBooking.isPending}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="text-center py-16">
              <CardContent>
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No bookings yet</h2>
                <p className="text-muted-foreground mb-4">
                  Browse available spaces and make your first booking.
                </p>
                <Button asChild>
                  <Link href="/spaces">Browse Spaces</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Incoming Requests Tab */}
      {activeTab === 'incoming' && (
        <div className="space-y-4">
          {loadingOwnerBookings ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-1/2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : ownerBookings && ownerBookings.length > 0 ? (
            ownerBookings.map((booking) => (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {booking.space?.title || 'Unknown Space'}
                      </CardTitle>
                      <CardDescription>
                        <span className="block">
                          Requested by: {booking.user?.name || booking.user?.email}
                        </span>
                        <span className="flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                        </span>
                      </CardDescription>
                    </div>
                    <span
                      className={`flex items-center gap-1 text-sm px-3 py-1 rounded-full ${getStatusClass(
                        booking.status
                      )}`}
                    >
                      {getStatusIcon(booking.status)}
                      {booking.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <p className="font-semibold">
                      Total: {formatCurrency(booking.totalPrice)}
                    </p>
                    <div className="flex gap-2">
                      {/* Message the booker */}
                      {booking.user && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            startConversation.mutate({
                              participantId: booking.user!.id,
                              spaceId: booking.spaceId,
                              bookingId: booking.id,
                            })
                          }
                          disabled={startConversation.isPending}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                      )}
                      {booking.status === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() =>
                              updateStatus.mutate({ id: booking.id, status: 'CONFIRMED' })
                            }
                            disabled={updateStatus.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" /> Confirm
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              updateStatus.mutate({ id: booking.id, status: 'REJECTED' })
                            }
                            disabled={updateStatus.isPending}
                          >
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="text-center py-16">
              <CardContent>
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No incoming requests</h2>
                <p className="text-muted-foreground">
                  When someone books your space, requests will appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
