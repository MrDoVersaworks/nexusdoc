import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { originGuard } from '../middleware/originGuard';
import { authRateLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema, deleteAccountSchema } from '../types';
import { config } from '../config';
import { REFRESH_COOKIE_NAME, REFRESH_TOKEN_EXPIRY_DAYS } from '../constants';
import { asyncHandler } from '../utils/asyncHandler';
import {
  registerUser, loginUser, refreshAccessToken, logoutUser, deleteUserAccount,
} from '../services/auth.service';

const router = Router();

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: (config.NODE_ENV === 'production' ? 'none' : 'lax') as const,
    path: '/',
  });
}

router.post('/register', authRateLimiter, validate(registerSchema), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await registerUser(req.body);
    res.status(201).json({ success: true, data: { user: result.user } });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('ERR_AUTH_EMAIL_EXISTS')) {
      res.status(409).json({ success: false, error: { code: 'ERR_AUTH_EMAIL_EXISTS', message: 'An account with this email already exists.' } });
      return;
    }
    throw error;
  }
}));

router.post('/login', originGuard, authRateLimiter, validate(loginSchema), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await loginUser(req.body.email, req.body.password);
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions());
    res.status(200).json({ success: true, data: { accessToken: result.accessToken, user: result.user } });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('ERR_AUTH_INVALID_CREDENTIALS')) {
      res.status(401).json({ success: false, error: { code: 'ERR_AUTH_INVALID_CREDENTIALS', message: 'Invalid email or password.' } });
      return;
    }
    throw error;
  }
}));

router.post('/refresh', originGuard, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      clearRefreshCookie(res);
      res.status(401).json({ success: false, error: { code: 'ERR_AUTH_REFRESH_FAILED', message: 'No refresh token provided.' } });
      return;
    }
    const result = await refreshAccessToken(refreshToken);
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions());
    res.status(200).json({ success: true, data: { accessToken: result.accessToken, user: result.user } });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('ERR_AUTH_REFRESH_FAILED')) {
      clearRefreshCookie(res);
      res.status(401).json({ success: false, error: { code: 'ERR_AUTH_REFRESH_FAILED', message: 'Invalid or expired refresh token. Please log in again.' } });
      return;
    }
    throw error;
  }
}));

router.post('/logout', originGuard, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
  if (refreshToken) await logoutUser(refreshToken);
  clearRefreshCookie(res);
  res.status(200).json({ success: true, data: null });
}));

router.delete('/account', authMiddleware, originGuard, validate(deleteAccountSchema), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: { code: 'ERR_AUTH_NO_TOKEN', message: 'Authentication required.' } });
      return;
    }
    await deleteUserAccount(req.userId, req.body.password);
    clearRefreshCookie(res);
    res.status(200).json({ success: true, data: null });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('ERR_AUTH_PASSWORD_MISMATCH')) {
      res.status(403).json({ success: false, error: { code: 'ERR_AUTH_PASSWORD_MISMATCH', message: 'Incorrect password.' } });
      return;
    }
    throw error;
  }
}));

export default router;
