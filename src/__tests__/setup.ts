import { vi } from 'vitest';
import { testDb, testChats, testUsers, resetTestDb } from './test-db.js';

vi.mock('../config/database.js', () => ({
  db: testDb,
}));

vi.mock('../db/schema.js', () => ({
  chats: testChats,
  users: testUsers,
}));

vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../config/env.js', () => ({
  env: {
    JWT_ACCESS_SECRET: 'test-access-secret-min-32-chars',
    JWT_REFRESH_SECRET: 'test-refresh-secret-min-32-chars',
    JWT_ACCESS_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '7d',
  },
}));

beforeEach(() => {
  resetTestDb();
});
