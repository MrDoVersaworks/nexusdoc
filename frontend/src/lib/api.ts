import { API_BASE_URL } from '@/constants';
import type { ApiResponse } from '@/types';

let accessToken: string | null = null;

export function setAccessToken(token: string): void { accessToken = token; }
export function clearAccessToken(): void { accessToken = null; }
export function getAccessToken(): string | null { return accessToken; }

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: object | FormData;
  requiresAuth?: boolean;
}

async function refreshToken(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, { method: 'POST', credentials: 'include' });
  if (!response.ok) { clearAccessToken(); throw new Error('Session expired. Please log in again.'); }
  const data = await response.json() as ApiResponse<{ accessToken: string; user: { id: string; email: string; name: string; isAdmin: boolean } }>;
  if (!data.success) { clearAccessToken(); throw new Error('Session expired. Please log in again.'); }
  setAccessToken(data.data.accessToken);
  return data.data.accessToken;
}

async function authorizedFetch(path: string, init: RequestInit, requiresAuth: boolean): Promise<Response> {
  const headers = new Headers(init.headers);
  if (requiresAuth && accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  let response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, credentials: 'include' });

  if (response.status === 401 && requiresAuth && accessToken) {
    const newToken = await refreshToken();
    headers.set('Authorization', `Bearer ${newToken}`);
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, credentials: 'include' });
  }
  return response;
}

export async function apiRequest<T>(options: RequestOptions): Promise<T> {
  const { method, path, body, requiresAuth = true } = options;
  const headers: Record<string, string> = {};
  let fetchBody: BodyInit | undefined;
  if (body instanceof FormData) fetchBody = body;
  else if (body) { headers['Content-Type'] = 'application/json'; fetchBody = JSON.stringify(body); }

  const response = await authorizedFetch(path, { method, headers, body: fetchBody }, requiresAuth);
  const data = await response.json();
  return data as T;
}

export async function apiBinaryRequest(path: string): Promise<Blob> {
  const response = await authorizedFetch(path, { method: 'GET' }, true);
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error?.message || 'Failed to retrieve document.');
  }
  return response.blob();
}
