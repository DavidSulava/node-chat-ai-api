import { describe, it, expect, vi } from 'vitest';
import { validate } from '../middlewares/validate.js';
import { registerUserSchema, chatMessageSchema, getMessagesSchema } from '../utils/validation.js';
import { Request, Response, NextFunction } from 'express';

describe('validate middleware', () => {
  const createMocks = () => {
    const req = { body: {} } as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;
    return { req, res, next };
  };

  describe('registerUserSchema', () => {
    it('calls next() with valid data', () => {
      const middleware = validate(registerUserSchema);
      const { req, res, next } = createMocks();
      req.body = { name: 'Test', email: 'test@test.com' };

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('throws error with empty name', () => {
      const middleware = validate(registerUserSchema);
      const { req, res, next } = createMocks();
      req.body = { name: '', email: 'test@test.com' };

      expect(() => middleware(req, res, next)).toThrow('Name is required');
    });

    it('throws error with invalid email', () => {
      const middleware = validate(registerUserSchema);
      const { req, res, next } = createMocks();
      req.body = { name: 'Test', email: 'invalid-email' };

      expect(() => middleware(req, res, next)).toThrow('Valid email is required');
    });

    it('throws error with missing fields', () => {
      const middleware = validate(registerUserSchema);
      const { req, res, next } = createMocks();
      req.body = {};

      expect(() => middleware(req, res, next)).toThrow();
    });
  });

  describe('chatMessageSchema', () => {
    it('calls next() with valid data', () => {
      const middleware = validate(chatMessageSchema);
      const { req, res, next } = createMocks();
      req.body = { message: 'Hello', userId: 'user1' };

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('throws error with empty message', () => {
      const middleware = validate(chatMessageSchema);
      const { req, res, next } = createMocks();
      req.body = { message: '', userId: 'user1' };

      expect(() => middleware(req, res, next)).toThrow('Message is required');
    });

    it('throws error with missing userId', () => {
      const middleware = validate(chatMessageSchema);
      const { req, res, next } = createMocks();
      req.body = { message: 'Hello' };

      expect(() => middleware(req, res, next)).toThrow();
    });
  });

  describe('getMessagesSchema', () => {
    it('calls next() with valid data', () => {
      const middleware = validate(getMessagesSchema);
      const { req, res, next } = createMocks();
      req.body = { userId: 'user1' };

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('throws error with missing userId', () => {
      const middleware = validate(getMessagesSchema);
      const { req, res, next } = createMocks();
      req.body = {};

      expect(() => middleware(req, res, next)).toThrow();
    });
  });
});