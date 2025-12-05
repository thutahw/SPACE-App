import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  placeType: string;
}

export interface AutocompleteResult {
  id: string;
  placeName: string;
  text: string;
  center: [number, number]; // [lng, lat]
}

interface MapboxResponse {
  features?: Array<{
    id: string;
    center: [number, number];
    place_name: string;
    text: string;
    place_type?: string[];
  }>;
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly mapboxToken: string | undefined;
  private readonly cache = new Map<string, { data: any; expires: number }>();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(private readonly configService: ConfigService) {
    this.mapboxToken = this.configService.get<string>('MAPBOX_ACCESS_TOKEN');

    if (!this.mapboxToken) {
      this.logger.warn(
        'MAPBOX_ACCESS_TOKEN not configured. Geocoding will be disabled.',
      );
    }
  }

  /**
   * Forward geocode: Address -> Coordinates
   */
  async geocode(address: string): Promise<GeocodingResult | null> {
    if (!this.mapboxToken) {
      this.logger.warn('Geocoding disabled: No Mapbox token');
      return null;
    }

    const cacheKey = `geocode:${address.toLowerCase()}`;
    const cached = this.getFromCache<GeocodingResult>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${this.mapboxToken}&limit=1`;

      const response = await fetch(url);
      const data = (await response.json()) as MapboxResponse;

      const feature = data.features?.[0];
      if (!feature) {
        return null;
      }

      const result: GeocodingResult = {
        longitude: feature.center[0],
        latitude: feature.center[1],
        formattedAddress: feature.place_name,
        placeType: feature.place_type?.[0] || 'unknown',
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      this.logger.error(`Geocoding failed for "${address}":`, error);
      return null;
    }
  }

  /**
   * Reverse geocode: Coordinates -> Address
   */
  async reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<GeocodingResult | null> {
    if (!this.mapboxToken) {
      this.logger.warn('Reverse geocoding disabled: No Mapbox token');
      return null;
    }

    const cacheKey = `reverse:${latitude.toFixed(6)},${longitude.toFixed(6)}`;
    const cached = this.getFromCache<GeocodingResult>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${this.mapboxToken}&limit=1`;

      const response = await fetch(url);
      const data = (await response.json()) as MapboxResponse;

      const feature = data.features?.[0];
      if (!feature) {
        return null;
      }

      const result: GeocodingResult = {
        longitude: feature.center[0],
        latitude: feature.center[1],
        formattedAddress: feature.place_name,
        placeType: feature.place_type?.[0] || 'unknown',
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      this.logger.error(
        `Reverse geocoding failed for (${latitude}, ${longitude}):`,
        error,
      );
      return null;
    }
  }

  /**
   * Address autocomplete for search
   */
  async autocomplete(
    query: string,
    proximity?: { lat: number; lng: number },
  ): Promise<AutocompleteResult[]> {
    if (!this.mapboxToken) {
      this.logger.warn('Autocomplete disabled: No Mapbox token');
      return [];
    }

    if (query.length < 2) {
      return [];
    }

    const cacheKey = `autocomplete:${query.toLowerCase()}:${proximity?.lat ?? 0},${proximity?.lng ?? 0}`;
    const cached = this.getFromCache<AutocompleteResult[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const encodedQuery = encodeURIComponent(query);
      let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${this.mapboxToken}&limit=5&types=address,place,poi,neighborhood,locality`;

      // Add proximity bias if provided
      if (proximity) {
        url += `&proximity=${proximity.lng},${proximity.lat}`;
      }

      const response = await fetch(url);
      const data = (await response.json()) as MapboxResponse;

      if (!data.features) {
        return [];
      }

      const results: AutocompleteResult[] = data.features.map((feature) => ({
        id: feature.id,
        placeName: feature.place_name,
        text: feature.text,
        center: feature.center,
      }));

      this.setCache(cacheKey, results);
      return results;
    } catch (error) {
      this.logger.error(`Autocomplete failed for "${query}":`, error);
      return [];
    }
  }

  /**
   * Check if geocoding is available
   */
  isAvailable(): boolean {
    return !!this.mapboxToken;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data as T;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + this.CACHE_TTL,
    });

    // Cleanup old entries periodically (simple eviction)
    if (this.cache.size > 1000) {
      const now = Date.now();
      for (const [k, v] of this.cache.entries()) {
        if (v.expires < now) {
          this.cache.delete(k);
        }
      }
    }
  }
}
