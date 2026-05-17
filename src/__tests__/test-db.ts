import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

const sqlite = require('better-sqlite3')(':memory:');
export const testDb = drizzle(sqlite);

export const testChats = sqliteTable('chats', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull(),
  message: text('message').notNull(),
  reply: text('reply').notNull(),
  createdAt: integer('created_at'),
});

export const testUsers = sqliteTable('users', {
  userId: text('user_id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  createdAt: integer('created_at'),
});

sqlite.exec(`
  CREATE TABLE chats (id INTEGER PRIMARY KEY, user_id TEXT NOT NULL, message TEXT NOT NULL, reply TEXT NOT NULL, created_at INTEGER);
  CREATE TABLE users (user_id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, created_at INTEGER);
`);

export const resetTestDb = () => {
  sqlite.exec('DELETE FROM chats');
  sqlite.exec('DELETE FROM users');
};

export { sqlite };