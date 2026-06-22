import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtBlocklist } from '../utils/blocklist';
import { config } from '../config';
import { ErrorCode } from '../constants';
import type { JwtAccessPayload, ApiErrorResponse } from '../types';

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: ErrorCode.AUTH_NO_TOKEN,
        message: 'Authentication required. No token provided.',
      },
    };
    res.status(401).json(response);
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: ErrorCode.AUTH_TOKEN_INVALID,
        message: 'Invalid authorization header format. Expected: Bearer <token>',
      },
    };
    res.status(401).json(response);
    return;
  }

  const token = parts[1];

  try {
    const signature = token.split('.')[2];
    if (signature && jwtBlocklist.has(signature)) {
      const response: ApiErrorResponse = {
        success: false,
        error: {
          code: ErrorCode.AUTH_TOKEN_INVALID,
          message: 'Session invalidated. Please log in again.',
        },
      };
      res.status(401).json(response);
      return;
    }

    const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtAccessPayload;
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (error: unknown) {
    if (error instanceof jwt.TokenExpiredError) {
      const response: ApiErrorResponse = {
        success: false,
        error: {
          code: ErrorCode.AUTH_TOKEN_EXPIRED,
          message: 'Access token has expired. Please refresh your token.',
        },
      };
      res.status(401).json(response);
      return;
    }

    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: ErrorCode.AUTH_TOKEN_INVALID,
        message: 'Invalid access token.',
      },
    };
    res.status(401).json(response);
  }
}
