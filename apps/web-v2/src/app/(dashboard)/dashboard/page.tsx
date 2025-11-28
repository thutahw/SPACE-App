'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { spacesApi, bookingsApi } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, MapPin, Calendar, Clock } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: mySpaces } = useQuery({
    queryKey: ['my-spaces'],
    queryFn: spacesApi.getMySpaces,
  });

  const { data: myBookings } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: bookingsApi.getMyBookings,
  });

  const { data: ownerBookings } = useQuery({
    queryKey: ['owner-bookings'],
    queryFn: bookingsApi.getOwnerBookings,
  });

  const pendingBookings = ownerBookings?.filter((b) => b.status === 'PENDING') || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
          <p className="text-muted-foreground">
            Here's what's happening with your spaces and bookings.
          </p>
        </div>
        <Button asChild>
          <Link href="/my-spaces/new">
            <Plus className="mr-2 h-4 w-4" /> List a Space
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Spaces</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mySpaces?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Active listings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myBookings?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Spaces booked</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingBookings.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incoming Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ownerBookings?.length || 0}</div>
            <p className="text-xs text-muted-foreground">For your spaces</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {myBookings && myBookings.length > 0 ? (
              <div className="space-y-4">
                {myBookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{booking.space?.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-sm px-2 py-1 rounded-full ${
                          booking.status === 'CONFIRMED'
                            ? 'bg-green-100 text-green-800'
                            : booking.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : booking.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {booking.status}
                      </span>
                      <p className="text-sm font-medium mt-1">
                        {formatCurrency(booking.totalPrice)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No bookings yet.{' '}
                <Link href="/spaces" className="text-primary hover:underline">
                  Browse spaces
                </Link>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Pending Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingBookings.length > 0 ? (
              <div className="space-y-4">
                {pendingBookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{booking.space?.title}</p>
                      <p className="text-sm text-muted-foreground">
                        From: {booking.user?.name || booking.user?.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                      </p>
                    </div>
                    <Button size="sm" asChild>
                      <Link href={`/bookings/${booking.id}`}>Review</Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No pending requests.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
