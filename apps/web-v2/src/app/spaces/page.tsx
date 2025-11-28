'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { spacesApi } from '@/lib/api-client';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Search, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

export default function SpacesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const limit = 12;

  const { data, isLoading } = useQuery({
    queryKey: ['spaces', page, search],
    queryFn: () => spacesApi.list({ page, limit, search: search || undefined }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Browse Spaces</h1>
            <p className="text-muted-foreground">
              Find the perfect advertising space for your brand
            </p>
          </div>
          <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
            <Input
              placeholder="Search spaces..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full md:w-64"
            />
            <Button type="submit" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded-t-lg" />
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data?.data && data.data.length > 0 ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.data.map((space) => (
                <Card key={space.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    {space.imageUrls && space.imageUrls.length > 0 && space.imageUrls[0] ? (
                      <img
                        src={space.imageUrls[0].startsWith('/') ? `${API_URL}${space.imageUrls[0]}` : space.imageUrls[0]}
                        alt={space.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <MapPin className="h-12 w-12 text-primary/40" />
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{space.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {space.description || 'No description available'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {space.location && (
                      <div className="flex items-center text-sm text-muted-foreground mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        {space.location}
                      </div>
                    )}
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(space.price)}
                      <span className="text-sm font-normal text-muted-foreground">
                        /day
                      </span>
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link href={`/spaces/${space.id}`}>View Details</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {data.meta.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {data.meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                  disabled={page === data.meta.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No spaces found</h2>
            <p className="text-muted-foreground mb-4">
              {search
                ? 'Try adjusting your search terms'
                : 'Be the first to list a space!'}
            </p>
            {search && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setSearchInput('');
                }}
              >
                Clear search
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
