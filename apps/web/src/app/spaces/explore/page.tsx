'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { mapApi } from '@/lib/api-client';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { MapPin, List, Map, X, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { AddressAutocomplete } from '@/components/address-autocomplete';

const SpaceMapExplorer = dynamic(() => import('@/components/space-map-explorer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ),
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

interface Space {
  id: string;
  title: string;
  price: number;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  imageUrls: string[];
  owner: { id: string; name: string | null; email: string };
}

interface Bounds {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}

export default function SpacesExplorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>({});
  const [showMap, setShowMap] = useState(true); // Mobile toggle
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch spaces within bounds
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['spaces-in-bounds', bounds, priceRange],
    queryFn: () =>
      mapApi.getInBounds({
        ...bounds!,
        minPrice: priceRange.min,
        maxPrice: priceRange.max,
        limit: 50,
      }),
    enabled: !!bounds,
    staleTime: 30000, // 30 seconds
  });

  const spaces = data?.data ?? [];

  const handleBoundsChange = useCallback((newBounds: Bounds) => {
    setBounds(newBounds);
  }, []);

  const handleSpaceSelect = useCallback((space: Space) => {
    setSelectedSpaceId(space.id);
  }, []);

  const handleSpaceHover = useCallback((spaceId: string | null) => {
    setSelectedSpaceId(spaceId);
  }, []);

  const selectedSpace = useMemo(
    () => spaces.find((s) => s.id === selectedSpaceId),
    [spaces, selectedSpaceId]
  );

  const handleAddressSelect = useCallback(
    (result: { lat: number; lng: number; address: string }) => {
      setMapCenter({ lat: result.lat, lng: result.lng });
    },
    []
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />

      {/* Search/Filter Bar */}
      <div className="border-b bg-background px-4 py-3">
        <div className="container flex items-center gap-4">
          <div className="flex-1 flex items-center gap-2">
            <h1 className="text-lg font-semibold hidden md:block">Explore Spaces</h1>
            <div className="flex-1 max-w-md">
              <AddressAutocomplete
                onSelect={handleAddressSelect}
                placeholder="Search location..."
                proximity={bounds ? { lat: (bounds.swLat + bounds.neLat) / 2, lng: (bounds.swLng + bounds.neLng) / 2 } : undefined}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isFetching && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {spaces.length} spaces in view
            </span>
            {/* Mobile toggle */}
            <div className="flex md:hidden">
              <Button
                variant={showMap ? 'outline' : 'default'}
                size="sm"
                onClick={() => setShowMap(false)}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={showMap ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowMap(true)}
              >
                <Map className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* List Panel */}
        <div
          className={cn(
            'w-full md:w-[400px] lg:w-[480px] border-r bg-background overflow-y-auto',
            'md:block',
            showMap ? 'hidden' : 'block'
          )}
        >
          <div className="p-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="p-4 animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 bg-muted rounded-lg" />
                      <div className="flex-1">
                        <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                        <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                        <div className="h-4 bg-muted rounded w-1/4" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : spaces.length > 0 ? (
              <div className="space-y-3">
                {spaces.map((space) => (
                  <SpaceListItem
                    key={space.id}
                    space={space}
                    isSelected={space.id === selectedSpaceId}
                    onHover={(hovered) => handleSpaceHover(hovered ? space.id : null)}
                    onClick={() => router.push(`/spaces/${space.id}`)}
                  />
                ))}
              </div>
            ) : bounds ? (
              <div className="text-center py-16">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No spaces in this area</h2>
                <p className="text-muted-foreground">
                  Try zooming out or panning to a different location
                </p>
              </div>
            ) : (
              <div className="text-center py-16">
                <Map className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Move the map to search</h2>
                <p className="text-muted-foreground">
                  Pan and zoom the map to discover spaces in that area
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Map Panel */}
        <div
          className={cn(
            'flex-1 relative',
            'md:block',
            showMap ? 'block' : 'hidden'
          )}
        >
          <SpaceMapExplorer
            spaces={spaces}
            selectedSpaceId={selectedSpaceId}
            onSpaceSelect={handleSpaceSelect}
            onBoundsChange={handleBoundsChange}
            center={mapCenter}
          />

          {/* Selected space card overlay (mobile) */}
          {selectedSpace && (
            <div className="absolute bottom-4 left-4 right-4 md:hidden">
              <Card className="p-3 shadow-lg">
                <button
                  onClick={() => setSelectedSpaceId(null)}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
                <Link href={`/spaces/${selectedSpace.id}`}>
                  <div className="flex gap-3">
                    <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      {selectedSpace.imageUrls?.[0] ? (
                        <img
                          src={
                            selectedSpace.imageUrls[0].startsWith('/')
                              ? `${API_URL}${selectedSpace.imageUrls[0]}`
                              : selectedSpace.imageUrls[0]
                          }
                          alt={selectedSpace.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <MapPin className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{selectedSpace.title}</h3>
                      {selectedSpace.location && (
                        <p className="text-sm text-muted-foreground truncate">
                          {selectedSpace.location}
                        </p>
                      )}
                      <p className="text-sm font-bold text-primary mt-1">
                        {formatCurrency(selectedSpace.price)}/day
                      </p>
                    </div>
                  </div>
                </Link>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface SpaceListItemProps {
  space: Space;
  isSelected: boolean;
  onHover: (hovered: boolean) => void;
  onClick: () => void;
}

function SpaceListItem({ space, isSelected, onHover, onClick }: SpaceListItemProps) {
  return (
    <Card
      className={cn(
        'p-3 cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-primary shadow-md'
      )}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={onClick}
    >
      <div className="flex gap-4">
        <div className="w-28 h-28 bg-muted rounded-lg overflow-hidden flex-shrink-0">
          {space.imageUrls?.[0] ? (
            <img
              src={
                space.imageUrls[0].startsWith('/')
                  ? `${API_URL}${space.imageUrls[0]}`
                  : space.imageUrls[0]
              }
              alt={space.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold mb-1 line-clamp-2">{space.title}</h3>
          {space.location && (
            <div className="flex items-center text-sm text-muted-foreground mb-2">
              <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
              <span className="truncate">{space.location}</span>
            </div>
          )}
          <p className="text-lg font-bold text-primary">
            {formatCurrency(space.price)}
            <span className="text-sm font-normal text-muted-foreground">/day</span>
          </p>
          {space.owner?.name && (
            <p className="text-xs text-muted-foreground mt-1">
              Listed by {space.owner.name}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
