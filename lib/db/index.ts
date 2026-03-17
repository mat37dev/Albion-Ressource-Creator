import { loadEnvConfig } from "@next/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Load environment variables (useful for standalone scripts)
if (typeof window === 'undefined') {
  loadEnvConfig(process.cwd());
}

// Lazy initialization - only create connection when actually used
let _db: ReturnType<typeof drizzle> | null = null;

function initDb() {
  if (_db) return _db;

  // Vercel Postgres uses pgbouncer, so we need prepare: false
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL;

  // During build time, we don't need DB connection
  if (!connectionString) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        "DATABASE_URL, POSTGRES_PRISMA_URL, or POSTGRES_URL environment variable must be set"
      );
    }
    // Return a dummy db for build time
    console.warn('⚠️  No DATABASE_URL found - using build-time stub');
    return null as any;
  }

  // Create client with pgbouncer compatibility
  const client = postgres(connectionString, {
    prepare: false, // Required for Vercel Postgres with pgbouncer
  });

  _db = drizzle(client, { schema });
  return _db;
}

// Export a getter instead of direct export
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    const dbInstance = initDb();
    return dbInstance[prop as keyof typeof dbInstance];
  },
});

// Legacy compatibility
export function getDb() {
  return initDb();
}

export { schema };
