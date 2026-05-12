'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { apiRequest, setAccessToken, clearAccessToken } from '@/lib/api';
import type { AuthUser, ApiResponse, LoginResponse, RegisterResponse } from '@/types';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Attempt to restore session via refresh token on mount
  useEffect(() => {
    async function restoreSession() {
      try {
        const data = await apiRequest<ApiResponse<{ accessToken: string }>>({
          method: 'POST',
          path: '/api/auth/refresh',
          requiresAuth: false,
        });

        if (data.success) {
          setAccessToken(data.data.accessToken);

          // Decode user info from JWT payload
          const payload = JSON.parse(atob(data.data.accessToken.split('.')[1]));

          if (!payload.userId || !payload.email || !payload.name) {
            throw new Error('[ERR_AUTH_INVALID_TOKEN] JWT payload missing required fields.');
          }

          setUser({ id: payload.userId, email: payload.email, name: payload.name });
        }
      } catch {
        // No valid session — user stays unauthenticated
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiRequest<ApiResponse<LoginResponse>>({
      method: 'POST',
      path: '/api/auth/login',
      body: { email, password },
      requiresAuth: false,
    });

    if (!data.success) {
      throw new Error(data.error.message);
    }

    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const data = await apiRequest<ApiResponse<RegisterResponse>>({
      method: 'POST',
      path: '/api/auth/register',
      body: { email, password, name },
      requiresAuth: false,
    });

    if (!data.success) {
      throw new Error(data.error.message);
    }

    // Auto-login after registration
    await login(email, password);
  }, [login]);

  const logout = useCallback(async () => {
    try {
      await apiRequest<ApiResponse<null>>({
        method: 'POST',
        path: '/api/auth/logout',
        requiresAuth: true,
      });
    } finally {
      clearAccessToken();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('[ERR_AUTH_CONTEXT] useAuth must be used within an AuthProvider.');
  }
  return context;
}
