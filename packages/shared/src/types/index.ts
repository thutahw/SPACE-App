import type { BookingStatus, UserRole } from '../constants';

// Base entity type
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// User types
export interface User extends BaseEntity {
  email: string;
  name: string | null;
  role: UserRole;
}

export interface UserWithPassword extends User {
  password: string;
}

// Space types
export interface Space extends BaseEntity {
  title: string;
  description: string | null;
  price: string; // Decimal as string for precision
  location: string | null;
  imageUrls: string[];
  ownerId: string;
  owner?: User;
}

// Booking types
export interface Booking extends BaseEntity {
  startDate: string;
  endDate: string;
  message: string | null;
  status: BookingStatus;
  userId: string;
  spaceId: string;
  user?: User;
  space?: Space;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Space request types
export interface CreateSpaceRequest {
  title: string;
  description?: string;
  price: number;
  location?: string;
  imageUrls?: string[];
}

export interface UpdateSpaceRequest {
  title?: string;
  description?: string;
  price?: number;
  location?: string;
  imageUrls?: string[];
}

// Booking request types
export interface CreateBookingRequest {
  spaceId: string;
  startDate: string;
  endDate: string;
  message?: string;
}

export interface UpdateBookingStatusRequest {
  status: BookingStatus;
}
