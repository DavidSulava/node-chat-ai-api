import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { env } from './env.ts';

// Init Neon client
const sql = neon(env.DATABASE_URL);
// Init Drizzle
export const db = drizzle(sql);
