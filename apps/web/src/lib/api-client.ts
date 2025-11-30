import type { ApiResponse } from '@space-app/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
};

class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getStoredTokens() {
  if (typeof window === 'undefined') return null;
  const tokens = localStorage.getItem('auth_tokens');
  return tokens ? JSON.parse(tokens) : null;
}

function setStoredTokens(tokens: { accessToken: string; refreshToken: string }) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_tokens', JSON.stringify(tokens));
}

function clearStoredTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_tokens');
}

// Refresh token lock to prevent race conditions
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  // If a refresh is already in progress, wait for it
  if (refreshPromise) {
    return refreshPromise;
  }

  const tokens = getStoredTokens();
  if (!tokens?.refreshToken) return null;

  // Create a new refresh promise
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      if (!response.ok) {
        clearStoredTokens();
        return null;
      }

      const data = await response.json();
      if (data.success && data.data.accessToken) {
        setStoredTokens({
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken || tokens.refreshToken,
        });
        return data.data.accessToken;
      }
      return null;
    } catch {
      clearStoredTokens();
      return null;
    } finally {
      // Clear the promise after completion
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {}, cache, next } = options;

  const tokens = getStoredTokens();
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (tokens?.accessToken) {
    requestHeaders['Authorization'] = `Bearer ${tokens.accessToken}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers: requestHeaders,
    cache,
  };

  if (next) {
    (fetchOptions as RequestInit & { next: NextFetchRequestConfig }).next = next;
  }

  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  let response = await fetch(`${API_URL}${endpoint}`, fetchOptions);

  // Handle token refresh on 401
  if (response.status === 401 && tokens?.accessToken) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      requestHeaders['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(`${API_URL}${endpoint}`, {
        ...fetchOptions,
        headers: requestHeaders,
      });
    }
  }

  const data: ApiResponse<T> = await response.json();

  if (!data.success || !response.ok) {
    throw new ApiError(
      response.status,
      data.error?.code || 'UNKNOWN_ERROR',
      data.error?.message || 'An unexpected error occurred',
      data.error?.details
    );
  }

  return data.data as T;
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<{
      user: { id: string; email: string; name: string; role: string };
      accessToken: string;
      refreshToken: string;
    }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  register: (email: string, password: string, name?: string) =>
    apiRequest<{
      user: { id: string; email: string; name: string; role: string };
      accessToken: string;
      refreshToken: string;
    }>('/auth/register', {
      method: 'POST',
      body: { email, password, name },
    }),

  logout: () =>
    apiRequest<void>('/auth/logout', { method: 'POST' }).finally(() => {
      clearStoredTokens();
    }),

  getProfile: () =>
    apiRequest<{ id: string; email: string; name: string; role: string }>(
      '/auth/profile'
    ),
};

// Spaces API
export const spacesApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    status?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.set(key, String(value));
      });
    }
    const query = searchParams.toString();
    return apiRequest<{
      data: Array<{
        id: string;
        title: string;
        description: string | null;
        price: number;
        location: string | null;
        imageUrls: string[];
        status: string;
        ownerId: string;
        createdAt: string;
        owner?: { id: string; name: string; email: string };
      }>;
      meta: { total: number; page: number; limit: number; totalPages: number };
    }>(`/spaces${query ? `?${query}` : ''}`);
  },

  get: (id: string) =>
    apiRequest<{
      id: string;
      title: string;
      description: string | null;
      price: number;
      location: string | null;
      imageUrls: string[];
      status: string;
      ownerId: string;
      createdAt: string;
      owner?: { id: string; name: string; email: string };
    }>(`/spaces/${id}`),

  create: (data: {
    title: string;
    description?: string;
    price: number;
    location?: string;
    imageUrls?: string[];
  }) =>
    apiRequest<{ id: string }>('/spaces', {
      method: 'POST',
      body: data,
    }),

  update: (
    id: string,
    data: {
      title?: string;
      description?: string;
      price?: number;
      location?: string;
      imageUrls?: string[];
      status?: string;
    }
  ) =>
    apiRequest<{ id: string }>(`/spaces/${id}`, {
      method: 'PATCH',
      body: data,
    }),

  delete: (id: string) =>
    apiRequest<void>(`/spaces/${id}`, { method: 'DELETE' }),

  getMySpaces: () =>
    apiRequest<
      Array<{
        id: string;
        title: string;
        description: string | null;
        price: number;
        location: string | null;
        status: string;
        createdAt: string;
      }>
    >('/spaces/my-spaces'),
};

// Bookings API
export const bookingsApi = {
  list: (params?: { page?: number; limit?: number; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.set(key, String(value));
      });
    }
    const query = searchParams.toString();
    return apiRequest<{
      data: Array<{
        id: string;
        spaceId: string;
        userId: string;
        startDate: string;
        endDate: string;
        status: string;
        totalPrice: number;
        message: string | null;
        createdAt: string;
        space?: { id: string; title: string; location: string | null };
      }>;
      meta: { total: number; page: number; limit: number; totalPages: number };
    }>(`/bookings${query ? `?${query}` : ''}`);
  },

  get: (id: string) =>
    apiRequest<{
      id: string;
      spaceId: string;
      userId: string;
      startDate: string;
      endDate: string;
      status: string;
      totalPrice: number;
      message: string | null;
      createdAt: string;
      space?: { id: string; title: string; location: string | null; price: number };
      user?: { id: string; name: string; email: string };
    }>(`/bookings/${id}`),

  create: (data: {
    spaceId: string;
    startDate: string;
    endDate: string;
    message?: string;
  }) =>
    apiRequest<{ id: string }>('/bookings', {
      method: 'POST',
      body: data,
    }),

  updateStatus: (id: string, status: string) =>
    apiRequest<{ id: string }>(`/bookings/${id}/status`, {
      method: 'PATCH',
      body: { status },
    }),

  cancel: (id: string) =>
    apiRequest<{ id: string }>(`/bookings/${id}/cancel`, {
      method: 'PATCH',
    }),

  getMyBookings: () =>
    apiRequest<
      Array<{
        id: string;
        spaceId: string;
        startDate: string;
        endDate: string;
        status: string;
        totalPrice: number;
        createdAt: string;
        space?: { id: string; title: string; location: string | null };
      }>
    >('/bookings/my-bookings'),

  getOwnerBookings: () =>
    apiRequest<
      Array<{
        id: string;
        spaceId: string;
        userId: string;
        startDate: string;
        endDate: string;
        status: string;
        totalPrice: number;
        createdAt: string;
        space?: { id: string; title: string };
        user?: { id: string; name: string; email: string };
      }>
    >('/bookings/owner-bookings'),
};

// Upload API
export const uploadApi = {
  uploadImage: async (file: File) => {
    const tokens = getStoredTokens();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'}/uploads/image`,
      {
        method: 'POST',
        headers: {
          Authorization: tokens?.accessToken ? `Bearer ${tokens.accessToken}` : '',
        },
        body: formData,
      }
    );

    const data = await response.json();

    if (!data.success || !response.ok) {
      throw new ApiError(
        response.status,
        data.error?.code || 'UPLOAD_ERROR',
        data.error?.message || 'Failed to upload image'
      );
    }

    return data.data as {
      originalName: string;
      filename: string;
      url: string;
      thumbnailUrl: string;
      size: number;
      mimeType: string;
    };
  },

  uploadImages: async (files: File[]) => {
    const tokens = getStoredTokens();
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'}/uploads/images`,
      {
        method: 'POST',
        headers: {
          Authorization: tokens?.accessToken ? `Bearer ${tokens.accessToken}` : '',
        },
        body: formData,
      }
    );

    const data = await response.json();

    if (!data.success || !response.ok) {
      throw new ApiError(
        response.status,
        data.error?.code || 'UPLOAD_ERROR',
        data.error?.message || 'Failed to upload images'
      );
    }

    return data.data as Array<{
      originalName: string;
      filename: string;
      url: string;
      thumbnailUrl: string;
      size: number;
      mimeType: string;
    }>;
  },

  deleteImage: (filename: string) =>
    apiRequest<void>(`/uploads/${filename}`, { method: 'DELETE' }),
};

export { ApiError, getStoredTokens, setStoredTokens, clearStoredTokens };
