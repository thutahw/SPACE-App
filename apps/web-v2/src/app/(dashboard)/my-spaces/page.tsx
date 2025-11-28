'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { spacesApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, MapPin, Edit, Trash2 } from 'lucide-react';

export default function MySpacesPage() {
  const queryClient = useQueryClient();

  const { data: spaces, isLoading } = useQuery({
    queryKey: ['my-spaces'],
    queryFn: spacesApi.getMySpaces,
  });

  const deleteSpace = useMutation({
    mutationFn: (id: string) => spacesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-spaces'] });
      toast({
        title: 'Space deleted',
        description: 'Your space has been deleted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to delete',
        description: error.message,
      });
    },
  });

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteSpace.mutate(id);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Spaces</h1>
          <p className="text-muted-foreground">
            Manage your listed advertising spaces
          </p>
        </div>
        <Button asChild>
          <Link href="/my-spaces/new">
            <Plus className="mr-2 h-4 w-4" /> Add New Space
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
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
      ) : spaces && spaces.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {spaces.map((space) => (
            <Card key={space.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="line-clamp-1">{space.title}</CardTitle>
                    <CardDescription>
                      {space.location && (
                        <span className="flex items-center mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {space.location}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      space.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {space.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(space.price)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /day
                  </span>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Created {formatDate(space.createdAt)}
                </p>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link href={`/my-spaces/${space.id}/edit`}>
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(space.id, space.title)}
                  disabled={deleteSpace.isPending}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-16">
          <CardContent>
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No spaces yet</h2>
            <p className="text-muted-foreground mb-4">
              Start earning by listing your first advertising space.
            </p>
            <Button asChild>
              <Link href="/my-spaces/new">
                <Plus className="mr-2 h-4 w-4" /> List Your First Space
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
