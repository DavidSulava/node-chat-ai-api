import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { createAuthService } from '../services/AuthService.js';
import { testDb, testUsers, resetTestDb, sqlite } from './test-db.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const mockChatClient = {
  queryUsers: vi.fn(),
  upsertUser: vi.fn(),
} as any;

describe('AuthService', () => {
  let authService: ReturnType<typeof createAuthService>;

  beforeEach(() => {
    vi.clearAllMocks();
    resetTestDb();
    authService = createAuthService(mockChatClient);
  });

  afterAll(() => {
    sqlite.close();
  });

  describe('register', () => {
    it('creates a new user and returns tokens', async () => {
      mockChatClient.upsertUser.mockResolvedValue({});

      const result = await authService.register({ login: 'testuser', password: 'password123' });

      expect(result.login).toBe('testuser');
      expect(result.userId).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(mockChatClient.upsertUser).toHaveBeenCalled();

      const dbUsers = await testDb.select().from(testUsers).where(eq(testUsers.login, 'testuser'));
      expect(dbUsers.length).toBe(1);
      expect(dbUsers[0].passwordHash).toBeDefined();
      expect(dbUsers[0].refreshToken).toBe(result.refreshToken);
    });

    it('throws error for duplicate login', async () => {
      mockChatClient.upsertUser.mockResolvedValue({});

      await authService.register({ login: 'testuser', password: 'password123' });

      await expect(
        authService.register({ login: 'testuser', password: 'password456' })
      ).rejects.toThrow('Login already exists');
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      mockChatClient.upsertUser.mockResolvedValue({});
      await authService.register({ login: 'testuser', password: 'password123' });
    });

    it('returns tokens with valid credentials', async () => {
      const result = await authService.login({ login: 'testuser', password: 'password123' });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.login).toBe('testuser');
    });

    it('throws error for invalid password', async () => {
      await expect(
        authService.login({ login: 'testuser', password: 'wrongpassword' })
      ).rejects.toThrow('Invalid login or password');
    });

    it('throws error for non-existent login', async () => {
      await expect(
        authService.login({ login: 'nonexistent', password: 'password123' })
      ).rejects.toThrow('Invalid login or password');
    });

    it('stores refresh token in database', async () => {
      const result = await authService.login({ login: 'testuser', password: 'password123' });

      const dbUsers = await testDb.select().from(testUsers).where(eq(testUsers.userId, result.userId));
      expect(dbUsers[0].refreshToken).toBe(result.refreshToken);
    });
  });

  describe('refreshToken', () => {
    let validRefreshToken: string;
    let userId: string;

    beforeEach(async () => {
      mockChatClient.upsertUser.mockResolvedValue({});
      const registered = await authService.register({ login: 'testuser', password: 'password123' });
      const loginResult = await authService.login({ login: 'testuser', password: 'password123' });
      validRefreshToken = loginResult.refreshToken;
      userId = loginResult.userId;
    });

    it('returns new token pair', async () => {
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const result = await authService.refreshToken(validRefreshToken);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.refreshToken).not.toBe(validRefreshToken);
    });

    it('throws error for invalid token', async () => {
      await expect(
        authService.refreshToken('invalid-token')
      ).rejects.toThrow('Invalid refresh token');
    });

    it('throws error if token does not match database', async () => {
      await authService.logout(userId);

      await expect(
        authService.refreshToken(validRefreshToken)
      ).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('logout', () => {
    let userId: string;

    beforeEach(async () => {
      mockChatClient.upsertUser.mockResolvedValue({});
      await authService.register({ login: 'testuser', password: 'password123' });
      const loginResult = await authService.login({ login: 'testuser', password: 'password123' });
      userId = loginResult.userId;
    });

    it('clears refresh token', async () => {
      await authService.logout(userId);

      const dbUsers = await testDb.select().from(testUsers).where(eq(testUsers.userId, userId));
      expect(dbUsers[0].refreshToken).toBeNull();
    });
  });
});
