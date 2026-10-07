import 'server-only'
import { pg } from '@/core/pg'

/**
 * Raw SQL client for the MAIN database (DATABASE_URL).
 *
 * The document service used to run on a separate "letterise" database
 * (LETTERISE_DATABASE_URL). Its tables were merged into the main database by
 * migration 0009, so every raw-SQL document-service query now runs here -
 * one database, one connection pool. Drizzle ORM code keeps using `core/db`.
 * 
 * Both clients share the pool created in `core/pg`. It used to create its own
 * client here, which doubled the number of connections and made
 * `CONNECT_TIMEOUT` failures (a hung/saturated pool) far more likely.
 */

export const sql = pg