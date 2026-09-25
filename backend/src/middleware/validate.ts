import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ErrorCode } from '../constants';
import type { ApiErrorResponse } from '../types';

type ValidationTarget = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const errorMessages = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
      const response: ApiErrorResponse = {
        success: false,
        error: { code: ErrorCode.VALIDATION_FAILED, message: errorMessages.join('; ') },
      };
      res.status(400).json(response);
      return;
    }
    if (target === 'body') req.body = result.data;
    if (target === 'query') req.query = result.data as Request['query'];
    if (target === 'params') req.params = result.data as Request['params'];
    next();
  };
}
