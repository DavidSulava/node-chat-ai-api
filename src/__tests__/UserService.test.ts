import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { createUserService } from '../services/UserService.js';
import { testDb, testUsers, sqlite } from './test-db.js';
import { eq } from 'drizzle-orm';

const mockChatClient = {
  queryUsers: vi.fn(),
  upsertUser: vi.fn(),
} as any;

describe('UserService', () => {
  let userService: ReturnType<typeof createUserService>;

  beforeEach(() => {
    vi.clearAllMocks();
    userService = createUserService(mockChatClient);
  });

  afterAll(() => {
    sqlite.close();
  });

  describe('registerUser', () => {
    it('creates a new user', async () => {
      mockChatClient.queryUsers.mockResolvedValue({ users: [] });
      mockChatClient.upsertUser.mockResolvedValue({});

      const result = await userService.registerUser({ name: 'Test', email: 'test@test.com' });
      
      expect(result.userId).toBe('test_test_com');
      expect(result.name).toBe('Test');
      expect(result.email).toBe('test@test.com');
      expect(mockChatClient.upsertUser).toHaveBeenCalledWith({
        id: 'test_test_com',
        name: 'Test',
        email: 'test@test.com',
        role: 'user',
      });

      const dbUsers = await testDb.select().from(testUsers).where(eq(testUsers.userId, 'test_test_com'));
      expect(dbUsers.length).toBe(1);
    });

    it('skips creation for existing user in Stream', async () => {
      mockChatClient.queryUsers.mockResolvedValue({ users: [{ id: 'test_test_com' }] });

      const result = await userService.registerUser({ name: 'Test', email: 'test@test.com' });
      
      expect(mockChatClient.upsertUser).not.toHaveBeenCalled();
      expect(result.userId).toBe('test_test_com');
    });

    it('does not duplicate user in database if Stream user exists', async () => {
      mockChatClient.queryUsers.mockResolvedValue({ users: [{ id: 'test_test_com' }] });

      await userService.registerUser({ name: 'Test', email: 'test@test.com' });

      const dbUsers = await testDb.select().from(testUsers).where(eq(testUsers.userId, 'test_test_com'));
      expect(dbUsers.length).toBe(1);
    });
  });

  describe('ensureUserExists', () => {
    it('throws error when user not found in Stream', async () => {
      mockChatClient.queryUsers.mockResolvedValue({ users: [] });

      await expect(userService.ensureUserExists('unknown')).rejects.toThrow('User not found');
    });

    it('throws error when user not found in database', async () => {
      mockChatClient.queryUsers.mockResolvedValue({ users: [{ id: 'existing_user' }] });

      await expect(userService.ensureUserExists('existing_user')).rejects.toThrow('User not found in database');
    });

    it('does not throw when user exists in both Stream and database', async () => {
      mockChatClient.queryUsers.mockResolvedValueOnce({ users: [] });
      mockChatClient.upsertUser.mockResolvedValue({});

      await userService.registerUser({ name: 'Test', email: 'test@test.com' });

      mockChatClient.queryUsers.mockResolvedValueOnce({ users: [{ id: 'test_test_com' }] });

      await expect(userService.ensureUserExists('test_test_com')).resolves.not.toThrow();
    });
  });
});