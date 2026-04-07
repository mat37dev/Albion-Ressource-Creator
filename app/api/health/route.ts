import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { albionItems } from '@/lib/db/schema';
import { count } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasDbUrl: !!process.env.DATABASE_URL,
    hasPostgresUrl: !!process.env.POSTGRES_URL,
    hasPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
    dbConnection: 'unknown',
    itemCount: 0,
    error: null as string | null,
  };

  try {
    checks.dbConnection = 'connected';

    // Test 2: Count items
    const [{ value: itemCount }] = await db.select({ value: count() }).from(albionItems);
    checks.itemCount = Number(itemCount);

    return NextResponse.json({
      status: 'ok',
      checks,
    });
  } catch (error) {
    checks.dbConnection = 'failed';
    checks.error = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        status: 'error',
        checks,
      },
      { status: 500 }
    );
  }
}
