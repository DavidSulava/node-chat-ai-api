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

beforeEach(() => {
  resetTestDb();
});