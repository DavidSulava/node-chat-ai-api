import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorHandler } from '../middlewares/errorHandler.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { Request, Response, NextFunction } from 'express';

vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('errorHandler middleware', () => {
  const createMocks = () => {
    const req = {} as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;
    return { req, res, next };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles AppError with correct status code', () => {
    const error = new AppError(404, 'Not found');
    const { req, res, next } = createMocks();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ status: 404, message: 'Not found' });
    expect(next).not.toHaveBeenCalled();
  });

  it('handles AppError with 400 status code', () => {
    const error = new AppError(400, 'Bad request');
    const { req, res, next } = createMocks();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ status: 400, message: 'Bad request' });
  });

  it('handles AppError with 500 status code', () => {
    const error = new AppError(500, 'Server error');
    const { req, res, next } = createMocks();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ status: 500, message: 'Server error' });
  });

  it('handles unknown errors with 500', () => {
    const error = new Error('Unknown error');
    const { req, res, next } = createMocks();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ status: 500, message: 'Internal Server Error' });
  });

  it('logs unknown errors', () => {
    const error = new Error('Something went wrong');
    const { req, res, next } = createMocks();

    errorHandler(error, req, res, next);

    expect(logger.error).toHaveBeenCalled();
  });

  it('does not call logger.error for AppError', () => {
    const error = new AppError(400, 'Validation error');
    const { req, res, next } = createMocks();

    errorHandler(error, req, res, next);

    expect(logger.error).not.toHaveBeenCalled();
  });
});