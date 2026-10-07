import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
import { pg } from '@/core/pg';

// The shared pool (and its connection timeouts) lives in `core/pg` so this
// client and the raw SQL client in `core/db-raw` cannot drift apart.
export const db = drizzle(pg, { schema });