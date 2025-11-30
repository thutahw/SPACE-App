// User roles - using string literal union types (compatible with Prisma enums)
export type UserRole = 'USER' | 'ADMIN';

export const UserRole = {
  USER: 'USER' as UserRole,
  ADMIN: 'ADMIN' as UserRole,
} as const;

// Booking statuses - using string literal union types (compatible with Prisma enums)
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';

export const BookingStatus = {
  PENDING: 'PENDING' as BookingStatus,
  CONFIRMED: 'CONFIRMED' as BookingStatus,
  REJECTED: 'REJECTED' as BookingStatus,
  CANCELLED: 'CANCELLED' as BookingStatus,
} as const;

export const ErrorCodes = {
  // Auth errors (1xxx)
  AUTH_INVALID_CREDENTIALS: 'AUTH_1001',
  AUTH_TOKEN_EXPIRED: 'AUTH_1002',
  AUTH_TOKEN_INVALID: 'AUTH_1003',
  AUTH_UNAUTHORIZED: 'AUTH_1004',
  AUTH_FORBIDDEN: 'AUTH_1005',

  // User errors (2xxx)
  USER_NOT_FOUND: 'USER_2001',
  USER_EMAIL_EXISTS: 'USER_2002',
  USER_DELETED: 'USER_2003',

  // Space errors (3xxx)
  SPACE_NOT_FOUND: 'SPACE_3001',
  SPACE_DELETED: 'SPACE_3002',
  SPACE_UNAUTHORIZED: 'SPACE_3003',

  // Booking errors (4xxx)
  BOOKING_NOT_FOUND: 'BOOKING_4001',
  BOOKING_OWN_SPACE: 'BOOKING_4002',
  BOOKING_INVALID_DATES: 'BOOKING_4003',
  BOOKING_CONFLICT: 'BOOKING_4004',

  // Validation errors (5xxx)
  VALIDATION_ERROR: 'VALIDATION_5001',

  // Server errors (9xxx)
  INTERNAL_ERROR: 'SERVER_9001',
  DATABASE_ERROR: 'SERVER_9002',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
