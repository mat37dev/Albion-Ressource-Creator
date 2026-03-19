import {loadEnvConfig} from "@next/env";
import {drizzle, drizzle as drizzleServerless} from "drizzle-orm/neon-serverless";
import {drizzle as drizzlePostgres} from "drizzle-orm/postgres-js";
import {neonConfig, Pool} from "@neondatabase/serverless";
import postgres from "postgres";
import * as schema from "./schema";

// Load environment variables (useful for standalone scripts)
if (typeof window === 'undefined') {
  loadEnvConfig(process.cwd());
}

// Lazy initialization - only create connection when actually used
let _db: ReturnType<typeof drizzleServerless> | ReturnType<typeof drizzlePostgres> | null = null;

function initDb() {
  if (_db) return _db;

  // PRIORITY: Use non-pooling URL for Neon Serverless/WebSocket
  // We explicitly avoid POSTGRES_PRISMA_URL as it points to db.prisma.io proxy which doesn't support Neon WebSocket protocol
  const connectionString =
    process.env.POSTGRES_URL_NON_POOLING || 
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL;

  // During build time, we don't need DB connection
  if (!connectionString) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        "DATABASE_URL, POSTGRES_URL, or POSTGRES_URL_NON_POOLING environment variable must be set"
      );
    }
    // Return a dummy db for build time
    console.warn('⚠️  No DATABASE_URL found - using build-time stub');
    return null as any;
  }

  // Use serverless driver by default (works everywhere, including corporate networks)
  // Falls back to postgres-js only if explicitly requested
  const useServerless = process.env.USE_SERVERLESS_DRIVER !== 'false';

  if (useServerless) {
    // Configure Neon for WebSocket (works through corporate firewalls)
    // Use 'ws' polyfill for Node.js, native WebSocket for browser
    if (typeof window === 'undefined') {
      // Node.js environment - use 'ws' package
      try {
        neonConfig.webSocketConstructor = require('ws');
      } catch (e) {
        console.error('❌ Missing "ws" package. Run: npm install ws');
        throw e;
      }
    }

    // Clean connection string: ensure it doesn't have prisma-specific query params that might confuse Neon
    const url = new URL(connectionString);
    // Remove pgbouncer related params if they exist (Neon handles this differently)
    url.searchParams.delete('pgbouncer');
    url.searchParams.delete('connect_timeout');
    
    _db = drizzleServerless(new Pool({ connectionString: url.toString() }), { schema });
    console.log('✅ Using Neon Serverless driver (WebSocket on port 443)');
  } else {
    // Fallback to traditional postgres-js (requires direct DB port access)
    const client = postgres(connectionString, {
      prepare: false, // Required for Vercel Postgres with pgbouncer
    });
    _db = drizzlePostgres(client, { schema });
    console.log('✅ Using postgres-js driver (direct connection)');
  }

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
