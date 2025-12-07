'use client';

import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issues with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface SpaceMapProps {
  spaces: Array<{
    id: string;
    title: string;
    location: string | null;
    latitude: number | null;
    longitude: number | null;
    price: string;
  }>;
  onMarkerClick?: (spaceId: string) => void;
}

export default function SpaceMap({ spaces, onMarkerClick }: SpaceMapProps) {
  useEffect(() => {
    // Initialize map
    const map = L.map('space-map').setView([37.5665, 126.9780], 11); // Default to Seoul

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add markers for spaces with coordinates
    const markers: L.Marker[] = [];
    spaces.forEach((space) => {
      if (space.latitude && space.longitude) {
        const marker = L.marker([space.latitude, space.longitude])
          .addTo(map)
          .bindPopup(`
            <div>
              <h3 style="font-weight: bold; margin-bottom: 4px;">${space.title}</h3>
              <p style="margin: 0; font-size: 0.875rem;">${space.location || ''}</p>
              <p style="margin: 0; font-size: 0.875rem; color: #059669; font-weight: 600;">₩${space.price}/day</p>
            </div>
          `);

        if (onMarkerClick) {
          marker.on('click', () => onMarkerClick(space.id));
        }
        markers.push(marker);
      }
    });

    // Fit map to markers if any exist
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    }

    // Cleanup on unmount
    return () => {
      map.remove();
    };
  }, [spaces, onMarkerClick]);

  return (
    <div
      id="space-map"
      style={{
        height: '500px',
        width: '100%',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    />
  );
}
