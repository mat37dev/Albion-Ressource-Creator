import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { albionItems } from '@/lib/db/schema';
import { eq, and, ilike, or, sql, asc, inArray } from 'drizzle-orm';
import { getCraftableItemIds } from '@/lib/db/queries/items';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache 1 heure

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');
    const tier = searchParams.get('tier');
    const enchant = searchParams.get('enchant');
    const search = searchParams.get('search');
    const locale = searchParams.get('locale') || 'en';
    const limit = parseInt(searchParams.get('limit') || '1000');
    const offset = parseInt(searchParams.get('offset') || '0');
    const craftable = searchParams.get('craftable') === 'true';
    const idsParam = searchParams.get('ids'); // Support batch fetch by IDs

    // Build conditions
    const conditions = [];

    // Filter by specific IDs (batch fetch)
    if (idsParam) {
      const ids = idsParam.split(',').filter(id => id.length > 0);
      if (ids.length > 0) {
        conditions.push(inArray(albionItems.id, ids));
      }
    }

    // Filter by craftable items
    if (craftable) {
      const craftableIds = await getCraftableItemIds();
      if (craftableIds.length > 0) {
        conditions.push(inArray(albionItems.id, craftableIds));
      }
    }

    if (category) {
      conditions.push(eq(albionItems.category, category));
    }

    if (subcategory) {
      conditions.push(eq(albionItems.subcategory, subcategory));
    }

    if (tier) {
      conditions.push(eq(albionItems.tier, parseInt(tier)));
    }

    const minTier = searchParams.get('minTier');
    const maxTier = searchParams.get('maxTier');
    if (minTier) conditions.push(sql`${albionItems.tier} >= ${parseInt(minTier)}`);
    if (maxTier) conditions.push(sql`${albionItems.tier} <= ${parseInt(maxTier)}`);

    if (enchant !== null && enchant !== undefined) {
      conditions.push(eq(albionItems.enchant, parseInt(enchant)));
    }

    if (search && search.length > 0) {
      const searchTerm = `%${search}%`;
      // Use OR to search in both locale-specific name AND item ID (case-insensitive)
      conditions.push(
        or(
          ilike(albionItems.id, searchTerm),
          locale === 'fr' 
            ? ilike(albionItems.nameFR, searchTerm) 
            : ilike(albionItems.nameEN, searchTerm)
        )
      );
    }

    // Build query
    let query = db.select().from(albionItems);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    // Apply limit and offset
    const items = await query
      .orderBy(asc(albionItems.tier), asc(albionItems.id))
      .limit(limit)
      .offset(offset);

    // Count total (for pagination)
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(albionItems);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions)) as any;
    }
    const [{ count: total }] = await countQuery;

    return NextResponse.json({
      items,
      total: Number(total),
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}
