import { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async Express route handler so any thrown/rejected error
 * is forwarded to Express's global error handler instead of crashing
 * the process. Required because Express 4.x does not natively catch
 * async errors in route handlers.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
