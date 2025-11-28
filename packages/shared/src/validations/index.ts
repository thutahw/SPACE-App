import { z } from 'zod';

import { BookingStatus, UserRole } from '../constants';

// User validations
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  name: z.string().min(1).max(100).optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  name: z.string().min(1).max(100).optional(),
  role: z.enum([UserRole.USER, UserRole.ADMIN]).optional(),
});

// Space validations
export const createSpaceSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters'),
  description: z.string().max(5000).optional(),
  price: z.number().positive('Price must be positive'),
  location: z.string().max(500).optional(),
  imageUrls: z.array(z.string().url()).max(10).optional(),
});

export const updateSpaceSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(255, 'Title must be less than 255 characters')
    .optional(),
  description: z.string().max(5000).optional(),
  price: z.number().positive('Price must be positive').optional(),
  location: z.string().max(500).optional(),
  imageUrls: z.array(z.string().url()).max(10).optional(),
});

// Booking validations
export const createBookingSchema = z
  .object({
    spaceId: z.string().min(1, 'Space ID is required'),
    startDate: z.string().datetime('Invalid start date'),
    endDate: z.string().datetime('Invalid end date'),
    message: z.string().max(1000).optional(),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export const updateBookingStatusSchema = z.object({
  status: z.enum([
    BookingStatus.PENDING,
    BookingStatus.CONFIRMED,
    BookingStatus.REJECTED,
    BookingStatus.CANCELLED,
  ]),
});

// Pagination validations
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateSpaceInput = z.infer<typeof createSpaceSchema>;
export type UpdateSpaceInput = z.infer<typeof updateSpaceSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
