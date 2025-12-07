'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { availabilityApi, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface AvailabilityCalendarProps {
  spaceId: string;
  isOwner?: boolean;
  onDateSelect?: (startDate: Date, endDate: Date) => void;
  selectedRange?: { start: Date | null; end: Date | null };
}

type DayStatus = 'available' | 'blocked' | 'booked' | 'selected' | 'past';

interface DayInfo {
  date: Date;
  status: DayStatus;
  priceOverride?: number | null;
  isInRange?: boolean;
}

export function AvailabilityCalendar({
  spaceId,
  isOwner = false,
  onDateSelect,
  selectedRange,
}: AvailabilityCalendarProps) {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectionStart, setSelectionStart] = useState<Date | null>(
    selectedRange?.start || null
  );
  const [selectionEnd, setSelectionEnd] = useState<Date | null>(
    selectedRange?.end || null
  );
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [isBlockMode, setIsBlockMode] = useState(false);

  // Calculate date range for query (3 months)
  const startDate = useMemo(() => {
    const date = new Date(currentMonth);
    date.setDate(1);
    return date.toISOString().split('T')[0] ?? '';
  }, [currentMonth]);

  const endDate = useMemo(() => {
    const date = new Date(currentMonth);
    date.setMonth(date.getMonth() + 3);
    return date.toISOString().split('T')[0] ?? '';
  }, [currentMonth]);

  const { data: availability, isLoading } = useQuery({
    queryKey: ['availability', spaceId, startDate, endDate],
    queryFn: () => availabilityApi.get(spaceId, startDate, endDate),
  });

  const blockMutation = useMutation({
    mutationFn: (dates: string[]) => availabilityApi.blockDates(spaceId, dates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability', spaceId] });
      toast({
        title: 'Dates blocked',
        description: 'Selected dates have been blocked.',
      });
      setSelectedDates(new Set());
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : 'Failed to block dates';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
      });
    },
  });

  const unblockMutation = useMutation({
    mutationFn: (dates: string[]) => availabilityApi.unblockDates(spaceId, dates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability', spaceId] });
      toast({
        title: 'Dates unblocked',
        description: 'Selected dates are now available.',
      });
      setSelectedDates(new Set());
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : 'Failed to unblock dates';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
      });
    },
  });

  // Build a map of date statuses
  const dateStatusMap = useMemo(() => {
    const map = new Map<string, { status: DayStatus; priceOverride?: number | null }>();

    if (availability?.availability) {
      availability.availability.forEach((entry) => {
        const dateKey = new Date(entry.date).toISOString().split('T')[0] ?? '';
        let status: DayStatus = 'available';
        if (entry.type === 'BLOCKED') status = 'blocked';
        if (entry.type === 'BOOKED') status = 'booked';
        map.set(dateKey, { status, priceOverride: entry.priceOverride });
      });
    }

    return map;
  }, [availability]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: DayInfo[][] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let monthOffset = 0; monthOffset < 2; monthOffset++) {
      const monthDate = new Date(currentMonth);
      monthDate.setMonth(monthDate.getMonth() + monthOffset);

      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startPadding = firstDay.getDay();

      const monthDays: DayInfo[] = [];

      // Add padding for days before the first of the month
      for (let i = 0; i < startPadding; i++) {
        const padDate = new Date(year, month, -startPadding + i + 1);
        monthDays.push({
          date: padDate,
          status: 'past',
        });
      }

      // Add days of the month
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        const dateKey = date.toISOString().split('T')[0] ?? '';
        const isPast = date < today;

        let status: DayStatus = 'available';
        let priceOverride: number | null = null;

        if (isPast) {
          status = 'past';
        } else {
          const entry = dateStatusMap.get(dateKey);
          if (entry) {
            status = entry.status;
            priceOverride = entry.priceOverride ?? null;
          }
        }

        // Check if date is in selected range
        let isInRange = false;
        if (selectionStart && selectionEnd && !isPast) {
          isInRange = date >= selectionStart && date <= selectionEnd;
        }

        monthDays.push({
          date,
          status,
          priceOverride,
          isInRange,
        });
      }

      days.push(monthDays);
    }

    return days;
  }, [currentMonth, dateStatusMap, selectionStart, selectionEnd]);

  const handleDayClick = (day: DayInfo) => {
    if (day.status === 'past' || day.status === 'booked') return;

    const dateKey = day.date.toISOString().split('T')[0] ?? '';

    if (isOwner && isBlockMode) {
      // Owner block mode - toggle date selection
      const newSelected = new Set(selectedDates);
      if (newSelected.has(dateKey)) {
        newSelected.delete(dateKey);
      } else {
        newSelected.add(dateKey);
      }
      setSelectedDates(newSelected);
    } else if (onDateSelect) {
      // Booking mode - select date range
      if (!selectionStart || (selectionStart && selectionEnd)) {
        setSelectionStart(day.date);
        setSelectionEnd(null);
      } else {
        const start = day.date < selectionStart ? day.date : selectionStart;
        const end = day.date < selectionStart ? selectionStart : day.date;
        setSelectionStart(start);
        setSelectionEnd(end);
        onDateSelect(start, end);
      }
    }
  };

  const handleBlock = () => {
    const dates = Array.from(selectedDates);
    if (dates.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No dates selected',
        description: 'Please select dates to block.',
      });
      return;
    }
    blockMutation.mutate(dates);
  };

  const handleUnblock = () => {
    const dates = Array.from(selectedDates);
    if (dates.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No dates selected',
        description: 'Please select dates to unblock.',
      });
      return;
    }
    unblockMutation.mutate(dates);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + (direction === 'next' ? 1 : -1));

    // Don't go before current month
    const today = new Date();
    if (newMonth < new Date(today.getFullYear(), today.getMonth(), 1)) {
      return;
    }

    setCurrentMonth(newMonth);
  };

  const getDayClassName = (day: DayInfo) => {
    const dateKey = day.date.toISOString().split('T')[0] ?? '';
    const isSelected = selectedDates.has(dateKey);

    const baseClasses =
      'w-10 h-10 flex flex-col items-center justify-center rounded-lg text-sm transition-colors';

    if (day.status === 'past') {
      return `${baseClasses} text-muted-foreground/50 cursor-not-allowed`;
    }

    if (day.status === 'booked') {
      return `${baseClasses} bg-blue-100 text-blue-800 cursor-not-allowed`;
    }

    if (day.status === 'blocked') {
      return `${baseClasses} bg-red-100 text-red-800 ${
        isOwner ? 'cursor-pointer hover:bg-red-200' : 'cursor-not-allowed'
      } ${isSelected ? 'ring-2 ring-primary' : ''}`;
    }

    if (day.isInRange) {
      return `${baseClasses} bg-primary text-primary-foreground`;
    }

    if (isSelected) {
      return `${baseClasses} bg-primary text-primary-foreground ring-2 ring-primary`;
    }

    return `${baseClasses} hover:bg-muted cursor-pointer ${
      day.priceOverride ? 'font-semibold' : ''
    }`;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isOwner && (
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <Button
            variant={isBlockMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setIsBlockMode(!isBlockMode);
              setSelectedDates(new Set());
            }}
          >
            {isBlockMode ? 'Exit Edit Mode' : 'Manage Availability'}
          </Button>
          {isBlockMode && (
            <>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBlock}
                disabled={selectedDates.size === 0 || blockMutation.isPending}
              >
                Block Selected ({selectedDates.size})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnblock}
                disabled={selectedDates.size === 0 || unblockMutation.isPending}
              >
                Unblock Selected
              </Button>
            </>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateMonth('prev')}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Button>
        <span className="font-medium">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateMonth('next')}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {calendarDays.map((monthDays, monthIndex) => {
          const monthDate = new Date(currentMonth);
          monthDate.setMonth(monthDate.getMonth() + monthIndex);

          return (
            <div key={monthIndex}>
              <h3 className="text-center font-medium mb-4">
                {monthNames[monthDate.getMonth()]} {monthDate.getFullYear()}
              </h3>
              <div className="grid grid-cols-7 gap-1">
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="w-10 h-8 flex items-center justify-center text-xs font-medium text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}
                {monthDays.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={getDayClassName(day)}
                    onClick={() => handleDayClick(day)}
                  >
                    <span>{day.date.getDate()}</span>
                    {day.priceOverride && (
                      <span className="text-[10px] text-muted-foreground">
                        {Math.round(day.priceOverride / 1000)}k
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-4 border-t">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-white border" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100" />
          <span>Blocked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-100" />
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary" />
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
}
