import { loadEnvConfig } from "@next/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Load environment variables (useful for standalone scripts)
loadEnvConfig(process.cwd());

// Vercel Postgres uses pgbouncer, so we need prepare: false
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL, POSTGRES_PRISMA_URL, or POSTGRES_URL environment variable must be set"
  );
}

// Create client with pgbouncer compatibility
const client = postgres(connectionString, {
  prepare: false, // Required for Vercel Postgres with pgbouncer
});

export const db = drizzle(client, { schema });

// Legacy compatibility
export function getDb() {
  return db;
}

export { schema };
