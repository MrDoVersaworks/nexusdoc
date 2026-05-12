import { API_BASE_URL } from '@/constants';
import type { ApiResponse } from '@/types';

let accessToken: string | null = null;

export function setAccessToken(token: string): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}

export function getAccessToken(): string | null {
  return accessToken;
}

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: Record<string, unknown> | FormData;
  requiresAuth?: boolean;
}

async function refreshToken(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    clearAccessToken();
    throw new Error('Session expired. Please log in again.');
  }

  const data = await response.json() as ApiResponse<{ accessToken: string }>;

  if (!data.success) {
    clearAccessToken();
    throw new Error('Session expired. Please log in again.');
  }

  const newToken = data.data.accessToken;
  setAccessToken(newToken);
  return newToken;
}

export async function apiRequest<T>(options: RequestOptions): Promise<T> {
  const { method, path, body, requiresAuth = true } = options;

  const headers: Record<string, string> = {};

  if (requiresAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let fetchBody: BodyInit | undefined;

  if (body instanceof FormData) {
    fetchBody = body;
  } else if (body) {
    headers['Content-Type'] = 'application/json';
    fetchBody = JSON.stringify(body);
  }

  let response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: fetchBody,
    credentials: 'include',
  });

  // If 401 and we have auth, attempt token refresh
  if (response.status === 401 && requiresAuth && accessToken) {
    try {
      const newToken = await refreshToken();
      headers['Authorization'] = `Bearer ${newToken}`;

      response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        body: fetchBody,
        credentials: 'include',
      });
    } catch {
      throw new Error('Session expired. Please log in again.');
    }
  }

  const data = await response.json();
  return data as T;
}
