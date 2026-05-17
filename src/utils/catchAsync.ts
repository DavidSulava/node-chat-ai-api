// src/utils/catchAsync.ts
import type { NextFunction, Request, Response } from "express";

/**
 * Wraps an async Express route handler and forwards any rejected promise
 * to the next error‑handling middleware.
 *
 * Usage:
 *   router.get('/path', catchAsync(async (req, res, next) => { ... }));
 */
export const catchAsync = (
  fn: (_req: Request, _res: Response, _next: NextFunction) => Promise<unknown>,
) => {
  return (_req: Request, _res: Response, _next: NextFunction) => {
    fn(_req, _res, _next).catch(_next);
  };
};
