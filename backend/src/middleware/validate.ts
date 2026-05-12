import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ErrorCode } from '../constants';
import type { ApiErrorResponse } from '../types';

type ValidationTarget = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const dataToValidate = req[target];
    const result = schema.safeParse(dataToValidate);

    if (!result.success) {
      const errorMessages = result.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`
      );

      const response: ApiErrorResponse = {
        success: false,
        error: {
          code: ErrorCode.VALIDATION_FAILED,
          message: errorMessages.join('; '),
        },
      };

      res.status(400).json(response);
      return;
    }

    // Replace the target data with parsed/validated data
    if (target === 'body') {
      req.body = result.data;
    }

    next();
  };
}
