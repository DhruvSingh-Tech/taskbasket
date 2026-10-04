import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/taskbasket';

import dns from 'node:dns';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Ignore in environments where not supported
}

const isSupabase =
  connectionString.includes('supabase.co') ||
  connectionString.includes('pooler.supabase.com');

// Supabase transaction pooler requires prepare: false
const client = postgres(connectionString, {
  prepare: false,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: isSupabase ? 'require' : false,
});

export const db = drizzle(client, { schema });
export type Database = typeof db;
export { schema };
