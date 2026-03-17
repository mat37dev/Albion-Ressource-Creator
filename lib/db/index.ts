import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Only create DB connection if DATABASE_URL is set
let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  if (!db) {
    const client = postgres(process.env.DATABASE_URL);
    db = drizzle(client, { schema });
  }

  return db;
}

export { schema };
