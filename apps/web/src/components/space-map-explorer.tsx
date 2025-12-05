'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatCurrency } from '@/lib/utils';

// Fix Leaflet default marker icon issues with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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

interface SpaceMapExplorerProps {
  spaces: Space[];
  selectedSpaceId?: string | null;
  onSpaceSelect?: (space: Space) => void;
  onBoundsChange?: (bounds: Bounds) => void;
  center?: { lat: number; lng: number } | null;
  className?: string;
}

// Create custom price marker icon
function createPriceMarkerIcon(price: number, isSelected: boolean = false): L.DivIcon {
  const formattedPrice = price >= 10000
    ? `${Math.round(price / 1000)}K`
    : price.toLocaleString();

  return L.divIcon({
    className: 'custom-price-marker',
    html: `
      <div class="price-marker ${isSelected ? 'price-marker-selected' : ''}">
        <span>${formattedPrice}</span>
      </div>
    `,
    iconSize: [60, 32],
    iconAnchor: [30, 32],
    popupAnchor: [0, -32],
  });
}

export default function SpaceMapExplorer({
  spaces,
  selectedSpaceId,
  onSpaceSelect,
  onBoundsChange,
  center,
  className = '',
}: SpaceMapExplorerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapId] = useState(() => `space-map-${Math.random().toString(36).substr(2, 9)}`);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [37.5665, 126.9780], // Default to Seoul
      zoom: 12,
      zoomControl: true,
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Handle map move/zoom
    const handleMoveEnd = () => {
      if (!onBoundsChange) return;

      // Guard against map not being fully initialized
      try {
        const bounds = map.getBounds();
        if (!bounds) return;

        onBoundsChange({
          swLat: bounds.getSouthWest().lat,
          swLng: bounds.getSouthWest().lng,
          neLat: bounds.getNorthEast().lat,
          neLng: bounds.getNorthEast().lng,
        });
      } catch (error) {
        // Map not ready yet, will be called again on next move
        console.debug('Map bounds not ready yet');
      }
    };

    map.on('moveend', handleMoveEnd);
    map.on('zoomend', handleMoveEnd);

    // Initial bounds callback
    setTimeout(handleMoveEnd, 100);

    mapRef.current = map;

    return () => {
      map.off('moveend', handleMoveEnd);
      map.off('zoomend', handleMoveEnd);
      map.remove();
      mapRef.current = null;
    };
  }, [onBoundsChange]);

  // Pan to center when it changes (from address search)
  useEffect(() => {
    if (!center || !mapRef.current) return;

    mapRef.current.setView([center.lat, center.lng], 14, {
      animate: true,
      duration: 0.5,
    });
  }, [center]);

  // Update markers when spaces change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentMarkers = markersRef.current;
    const newSpaceIds = new Set(spaces.map((s) => s.id));

    // Remove markers for spaces no longer in the list
    currentMarkers.forEach((marker, id) => {
      if (!newSpaceIds.has(id)) {
        marker.remove();
        currentMarkers.delete(id);
      }
    });

    // Add or update markers
    spaces.forEach((space) => {
      if (!space.latitude || !space.longitude) return;

      const existingMarker = currentMarkers.get(space.id);
      const isSelected = space.id === selectedSpaceId;
      const icon = createPriceMarkerIcon(space.price, isSelected);

      if (existingMarker) {
        // Update existing marker
        existingMarker.setIcon(icon);
      } else {
        // Create new marker
        const marker = L.marker([space.latitude, space.longitude], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="min-width: 200px;">
              <h3 style="font-weight: bold; margin: 0 0 4px 0; font-size: 14px;">${space.title}</h3>
              ${space.location ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${space.location}</p>` : ''}
              <p style="margin: 0; font-size: 14px; color: #059669; font-weight: 600;">${formatCurrency(space.price)}/day</p>
            </div>
          `);

        marker.on('click', () => {
          if (onSpaceSelect) {
            onSpaceSelect(space);
          }
        });

        currentMarkers.set(space.id, marker);
      }
    });
  }, [spaces, selectedSpaceId, onSpaceSelect]);

  // Pan to selected space
  useEffect(() => {
    if (!selectedSpaceId || !mapRef.current) return;

    const selectedSpace = spaces.find((s) => s.id === selectedSpaceId);
    if (selectedSpace?.latitude && selectedSpace?.longitude) {
      mapRef.current.panTo([selectedSpace.latitude, selectedSpace.longitude], {
        animate: true,
        duration: 0.5,
      });

      // Open popup
      const marker = markersRef.current.get(selectedSpaceId);
      if (marker) {
        marker.openPopup();
      }
    }
  }, [selectedSpaceId, spaces]);

  return (
    <>
      <style jsx global>{`
        .custom-price-marker {
          background: transparent;
          border: none;
        }
        .price-marker {
          background: white;
          border-radius: 20px;
          padding: 6px 12px;
          font-weight: 600;
          font-size: 13px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          white-space: nowrap;
          display: inline-block;
          transition: all 0.2s ease;
          border: 2px solid transparent;
        }
        .price-marker:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        .price-marker-selected {
          background: #000;
          color: white;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
        }
        .leaflet-popup-content {
          margin: 12px;
        }
      `}</style>
      <div
        ref={containerRef}
        id={mapId}
        className={`w-full h-full ${className}`}
        style={{ minHeight: '400px' }}
      />
    </>
  );
}
