import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { albionItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const revalidate = 3600; // Cache 1 heure

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [item] = await db
      .select()
      .from(albionItems)
      .where(eq(albionItems.id, id))
      .limit(1);

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch item' },
      { status: 500 }
    );
  }
}
