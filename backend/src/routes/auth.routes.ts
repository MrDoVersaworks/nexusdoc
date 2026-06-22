import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema, deleteAccountSchema } from '../types';
import { config } from '../config';
import { REFRESH_COOKIE_NAME, REFRESH_TOKEN_EXPIRY_DAYS } from '../constants';
import { asyncHandler } from '../utils/asyncHandler';
import { jwtBlocklist } from '../utils/blocklist';
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  deleteUserAccount,
} from '../services/auth.service';


const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  authRateLimiter,
  validate(registerSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, name } = req.body;
      const result = await registerUser({ email, password, name });

      res.status(201).json({
        success: true,
        data: { user: result.user },
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('ERR_AUTH_EMAIL_EXISTS')) {
        res.status(409).json({
          success: false,
          error: { code: 'ERR_AUTH_EMAIL_EXISTS', message: 'An account with this email already exists.' },
        });
        return;
      }
      throw error;
    }
  })
);

// POST /api/auth/login
router.post(
  '/login',
  authRateLimiter,
  validate(loginSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await loginUser(email, password);

      // Set refresh token as httpOnly cookie
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
        path: '/',
      });

      res.status(200).json({
        success: true,
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('ERR_AUTH_INVALID_CREDENTIALS')) {
        res.status(401).json({
          success: false,
          error: { code: 'ERR_AUTH_INVALID_CREDENTIALS', message: 'Invalid email or password.' },
        });
        return;
      }
      throw error;
    }
  })
);

// POST /api/auth/refresh
router.post('/refresh', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME];

    if (!refreshToken) {
      res.status(200).json({
        success: false,
        error: { code: 'ERR_AUTH_REFRESH_FAILED', message: 'No refresh token provided.' },
      });
      return;
    }

    const accessToken = await refreshAccessToken(refreshToken);

    res.status(200).json({
      success: true,
      data: { accessToken },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('ERR_AUTH_REFRESH_FAILED')) {
      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
      res.status(200).json({
        success: false,
        error: { code: 'ERR_AUTH_REFRESH_FAILED', message: 'Invalid or expired refresh token. Please log in again.' },
      });
      return;
    }
    throw error;
  }
}));

// POST /api/auth/logout
router.post('/logout', authMiddleware, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies[REFRESH_COOKIE_NAME];

  if (refreshToken) {
    await logoutUser(refreshToken);
  }

  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    if (token) {
      const signature = token.split('.')[2];
      if (signature) {
        jwtBlocklist.add(signature);
      }
    }
  }

  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });

  res.status(200).json({
    success: true,
    data: null,
  });
}));

// DELETE /api/auth/account
router.delete(
  '/account',
  authMiddleware,
  validate(deleteAccountSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'ERR_AUTH_NO_TOKEN', message: 'Authentication required.' },
        });
        return;
      }

      const { password } = req.body;

      // Blocklist the current access token immediately
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const token = authHeader.split(' ')[1];
        if (token) {
          const signature = token.split('.')[2];
          if (signature) {
            jwtBlocklist.add(signature);
          }
        }
      }

      await deleteUserAccount(userId, password);

      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });

      res.status(200).json({
        success: true,
        data: null,
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('ERR_AUTH_PASSWORD_MISMATCH')) {
        res.status(403).json({
          success: false,
          error: { code: 'ERR_AUTH_PASSWORD_MISMATCH', message: 'Incorrect password.' },
        });
        return;
      }
      throw error;
    }
  })
);

export default router;
