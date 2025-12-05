'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import { geocodingApi } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface AutocompleteResult {
  id: string;
  placeName: string;
  text: string;
  center: [number, number]; // [lng, lat]
}

interface AddressAutocompleteProps {
  onSelect: (result: { lat: number; lng: number; address: string }) => void;
  placeholder?: string;
  proximity?: { lat: number; lng: number };
  className?: string;
  defaultValue?: string;
}

export function AddressAutocomplete({
  onSelect,
  placeholder = 'Search location...',
  proximity,
  className,
  defaultValue = '',
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(defaultValue);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        setDebouncedQuery(query);
      } else {
        setDebouncedQuery('');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch autocomplete results
  const { data, isLoading } = useQuery({
    queryKey: ['autocomplete', debouncedQuery, proximity?.lat, proximity?.lng],
    queryFn: () => geocodingApi.autocomplete(debouncedQuery, proximity),
    enabled: debouncedQuery.length >= 2,
    staleTime: 60000, // Cache for 1 minute
  });

  const results = data?.data ?? [];

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (result: AutocompleteResult) => {
      setQuery(result.placeName);
      setIsOpen(false);
      onSelect({
        lng: result.center[0],
        lat: result.center[1],
        address: result.placeName,
      });
    },
    [onSelect]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || results.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          break;
      }
    },
    [isOpen, results, selectedIndex, handleSelect]
  );

  const handleClear = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    inputRef.current?.focus();
  }, []);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            if (query.length >= 2) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-9 pr-9"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (query.length >= 2 || isLoading) && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-4 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Searching...
            </div>
          ) : results.length > 0 ? (
            <ul className="py-1">
              {results.map((result, index) => (
                <li key={result.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(result)}
                    className={cn(
                      'w-full px-3 py-2 text-left flex items-start gap-2 hover:bg-muted transition-colors',
                      index === selectedIndex && 'bg-muted'
                    )}
                  >
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{result.text}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {result.placeName}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : debouncedQuery.length >= 2 ? (
            <div className="p-4 text-center text-muted-foreground">
              No results found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
