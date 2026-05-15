// src/utils/catchAsync.ts
import type { RequestHandler, NextFunction, Request, Response } from 'express';

/**
 * Wraps an async Express route handler and forwards any rejected promise
 * to the next error‑handling middleware.
 *
 * Usage:
 *   router.get('/path', catchAsync(async (req, res, next) => { ... }));
 */
export const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
