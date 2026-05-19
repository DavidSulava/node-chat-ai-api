import { describe, it, expect, vi } from 'vitest';
import { validate } from '../middlewares/validate.js';
import { authRegisterSchema, authLoginSchema, refreshTokenSchema, chatMessageSchema, getMessagesSchema } from '../utils/validation.js';
import { Request, Response, NextFunction } from 'express';

describe('validate middleware', () => {
  const createMocks = () => {
    const req = { body: {} } as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;
    return { req, res, next };
  };

  describe('authRegisterSchema', () => {
    it('calls next() with valid data', () => {
      const middleware = validate(authRegisterSchema);
      const { req, res, next } = createMocks();
      req.body = { login: 'testuser', password: 'password123' };

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('throws error with short login', () => {
      const middleware = validate(authRegisterSchema);
      const { req, res, next } = createMocks();
      req.body = { login: 'ab', password: 'password123' };

      expect(() => middleware(req, res, next)).toThrow('at least 3 characters');
    });

    it('throws error with short password', () => {
      const middleware = validate(authRegisterSchema);
      const { req, res, next } = createMocks();
      req.body = { login: 'testuser', password: '12345' };

      expect(() => middleware(req, res, next)).toThrow('at least 6 characters');
    });

    it('throws error with missing fields', () => {
      const middleware = validate(authRegisterSchema);
      const { req, res, next } = createMocks();
      req.body = {};

      expect(() => middleware(req, res, next)).toThrow();
    });
  });

  describe('authLoginSchema', () => {
    it('calls next() with valid data', () => {
      const middleware = validate(authLoginSchema);
      const { req, res, next } = createMocks();
      req.body = { login: 'testuser', password: 'password123' };

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('throws error with missing login', () => {
      const middleware = validate(authLoginSchema);
      const { req, res, next } = createMocks();
      req.body = { password: 'password123' };

      expect(() => middleware(req, res, next)).toThrow();
    });

    it('throws error with missing password', () => {
      const middleware = validate(authLoginSchema);
      const { req, res, next } = createMocks();
      req.body = { login: 'testuser' };

      expect(() => middleware(req, res, next)).toThrow();
    });
  });

  describe('refreshTokenSchema', () => {
    it('calls next() with valid data', () => {
      const middleware = validate(refreshTokenSchema);
      const { req, res, next } = createMocks();
      req.body = { refreshToken: 'some-token' };

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('throws error with missing token', () => {
      const middleware = validate(refreshTokenSchema);
      const { req, res, next } = createMocks();
      req.body = {};

      expect(() => middleware(req, res, next)).toThrow();
    });
  });

  describe('chatMessageSchema', () => {
    it('calls next() with valid data', () => {
      const middleware = validate(chatMessageSchema);
      const { req, res, next } = createMocks();
      req.body = { message: 'Hello' };

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('throws error with empty message', () => {
      const middleware = validate(chatMessageSchema);
      const { req, res, next } = createMocks();
      req.body = { message: '' };

      expect(() => middleware(req, res, next)).toThrow('Message is required');
    });
  });

  describe('getMessagesSchema', () => {
    it('calls next() with empty body', () => {
      const middleware = validate(getMessagesSchema);
      const { req, res, next } = createMocks();
      req.body = {};

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
